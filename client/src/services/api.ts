import axios from 'axios';
import type { ApiResponse, Task, Comment, Activity, User, Notification, Pagination, TaskFilters, DashboardData } from '../types';

const api = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.includes('/auth/')) {
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const authApi = {
  signup: (data: { email: string; name: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/signup', data).then(r => r.data),
  login: (data: { email: string; password: string }) =>
    api.post<ApiResponse<{ user: User; token: string }>>('/auth/login', data).then(r => r.data),
  logout: () => api.post<ApiResponse<null>>('/auth/logout').then(r => r.data),
  me: () => api.get<ApiResponse<User>>('/auth/me').then(r => r.data),
};

export const taskApi = {
  list: (filters?: TaskFilters) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
      });
    }
    return api.get<ApiResponse<{ tasks: Task[]; pagination: Pagination }>>(`/tasks?${params}`).then(r => r.data);
  },
  get: (id: string) => api.get<ApiResponse<Task>>(`/tasks/${id}`).then(r => r.data),
  create: (data: { title: string; description?: string; priority?: string; status?: string; dueDate?: string; assigneeIds?: string[] }) =>
    api.post<ApiResponse<Task>>('/tasks', data).then(r => r.data),
  update: (id: string, data: Record<string, unknown>) =>
    api.patch<ApiResponse<Task>>(`/tasks/${id}`, data).then(r => r.data),
  delete: (id: string) => api.delete<ApiResponse<string>>(`/tasks/${id}`).then(r => r.data),
  dashboard: async (assigneeId?: string): Promise<DashboardData> => {
    const [allRes, myRes] = await Promise.all([
      api.get<ApiResponse<{ tasks: Task[]; pagination: Pagination }>>('/tasks?limit=100'),
      api.get<ApiResponse<{ tasks: Task[] }>>(`/tasks?limit=5${assigneeId ? `&assigneeId=${assigneeId}` : ''}`),
    ]);
    const all = allRes.data.data.tasks;
    return {
      total: allRes.data.data.pagination.total,
      todo: all.filter(t => t.status === 'TODO').length,
      inProgress: all.filter(t => t.status === 'IN_PROGRESS').length,
      completed: all.filter(t => t.status === 'COMPLETED').length,
      overdue: all.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED').length,
      highPriority: all.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').length,
      recentTasks: all.slice(0, 5),
      myTasks: myRes.data.data.tasks,
    };
  },
};

export const commentApi = {
  list: (taskId: string) => api.get<ApiResponse<Comment[]>>(`/tasks/${taskId}/comments`).then(r => r.data),
  create: (taskId: string, content: string) => api.post<ApiResponse<Comment>>(`/tasks/${taskId}/comments`, { content }).then(r => r.data),
  update: (commentId: string, content: string) => api.patch<ApiResponse<Comment>>(`/comments/${commentId}`, { content }).then(r => r.data),
  delete: (commentId: string) => api.delete<ApiResponse<string>>(`/comments/${commentId}`).then(r => r.data),
};

export const activityApi = {
  list: (taskId: string) => api.get<ApiResponse<Activity[]>>(`/tasks/${taskId}/activity`).then(r => r.data),
};

export const userApi = {
  list: () => api.get<ApiResponse<User[]>>('/users').then(r => r.data),
  get: (id: string) => api.get<ApiResponse<User>>(`/users/${id}`).then(r => r.data),
};

export const notificationApi = {
  list: () => api.get<ApiResponse<Notification[]>>('/notifications').then(r => r.data),
  markRead: (id: string) => api.patch<ApiResponse<Notification>>(`/notifications/${id}/read`).then(r => r.data),
  markAllRead: () => api.patch<ApiResponse<null>>('/notifications/read-all').then(r => r.data),
};

export const uploadApi = {
  upload: (taskId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ id: string; filename: string; originalName: string }>>(`/uploads/tasks/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },
};

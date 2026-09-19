export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  avatarColor: string;
  createdAt: string;
  updatedAt?: string;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type Status = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'COMPLETED';

export interface TaskAssignee {
  id: string;
  user: User;
}

export interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: Priority;
  status: Status;
  dueDate: string | null;
  creatorId: string;
  creator: User;
  assignees: TaskAssignee[];
  _count: { comments: number; attachments: number; activities?: number };
  createdAt: string;
  updatedAt: string;
  comments?: Comment[];
  attachments?: Attachment[];
  activities?: Activity[];
}

export interface Comment {
  id: string;
  content: string;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface Activity {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  taskId: string;
  userId: string;
  user: User;
  createdAt: string;
}

export interface Notification {
  id: string;
  message: string;
  read: boolean;
  taskId: string | null;
  userId: string;
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: { code: string; message: string };
}

export interface TaskFilters {
  page?: number;
  limit?: number;
  status?: Status;
  priority?: Priority;
  search?: string;
  assigneeId?: string;
  creatorId?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  overdue?: string;
}

export interface DashboardData {
  total: number;
  todo: number;
  inProgress: number;
  completed: number;
  overdue: number;
  highPriority: number;
  recentTasks: Task[];
  myTasks: Task[];
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, commentApi, activityApi, userApi, uploadApi, notificationApi } from '../services/api';
import type { TaskFilters } from '../types';

export function useTasks(filters?: TaskFilters) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskApi.list(filters),
  });
}

export function useTask(id: string) {
  return useQuery({
    queryKey: ['task', id],
    queryFn: () => taskApi.get(id),
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: taskApi.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => taskApi.update(id, data),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['task', vars.id] }); },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: taskApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tasks'] }); qc.invalidateQueries({ queryKey: ['dashboard'] }); },
  });
}

export function useDashboard(assigneeId?: string) {
  return useQuery({ queryKey: ['dashboard', assigneeId], queryFn: () => taskApi.dashboard(assigneeId), enabled: !!assigneeId });
}

export function useComments(taskId: string) {
  return useQuery({ queryKey: ['comments', taskId], queryFn: () => commentApi.list(taskId), enabled: !!taskId });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, content }: { taskId: string; content: string }) => commentApi.create(taskId, content),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['comments', vars.taskId] }); qc.invalidateQueries({ queryKey: ['task', vars.taskId] }); },
  });
}

export function useUpdateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) => commentApi.update(commentId, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments'] }); },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: commentApi.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['comments'] }); },
  });
}

export function useActivities(taskId: string) {
  return useQuery({ queryKey: ['activities', taskId], queryFn: () => activityApi.list(taskId), enabled: !!taskId });
}

export function useUsers() {
  return useQuery({ queryKey: ['users'], queryFn: userApi.list, staleTime: 300000 });
}

export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: notificationApi.list });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['notifications'] }); },
  });
}

export function useUploadAttachment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, file }: { taskId: string; file: File }) => uploadApi.upload(taskId, file),
    onSuccess: (_d, vars) => { qc.invalidateQueries({ queryKey: ['task', vars.taskId] }); },
  });
}

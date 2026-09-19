import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './useAuth';
import { connectSocket, disconnectSocket, subscribeRealtime } from '../services/socket';
import toast from 'react-hot-toast';

export function useRealtime() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) {
      disconnectSocket();
      return;
    }

    connectSocket(undefined);

    const unsubscribe = subscribeRealtime(({ event, payload }) => {
      const data = payload as { taskId?: string; message?: string };
      if (!data?.taskId) return;

      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      if (data.taskId) {
        queryClient.invalidateQueries({ queryKey: ['task', data.taskId] });
        queryClient.invalidateQueries({ queryKey: ['comments', data.taskId] });
        queryClient.invalidateQueries({ queryKey: ['activities', data.taskId] });
      }

      if (event === 'notification' && data.message) {
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
        toast(data.message, { icon: '🔔' });
      }
    });

    return () => {
      unsubscribe();
      disconnectSocket();
    };
  }, [user, queryClient]);

  return null;
}
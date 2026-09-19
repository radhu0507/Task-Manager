import type { Priority, Status } from '../types';

export const priorityConfig: Record<Priority, { label: string; color: string; bg: string }> = {
  LOW: { label: 'Low', color: 'text-blue-600', bg: 'bg-blue-100' },
  MEDIUM: { label: 'Medium', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  HIGH: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
  URGENT: { label: 'Urgent', color: 'text-red-600', bg: 'bg-red-100' },
};

export const statusConfig: Record<Status, { label: string; color: string; bg: string }> = {
  TODO: { label: 'To Do', color: 'text-gray-600', bg: 'bg-gray-100' },
  IN_PROGRESS: { label: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' },
  REVIEW: { label: 'Review', color: 'text-purple-600', bg: 'bg-purple-100' },
  COMPLETED: { label: 'Completed', color: 'text-green-600', bg: 'bg-green-100' },
};

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(date));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diff = now.getTime() - then.getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export function isOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

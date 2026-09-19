import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTasks, useCreateTask, useDeleteTask, useUsers } from '../hooks/useApi';
import { priorityConfig, statusConfig, formatDate, isOverdue, getInitials } from '../utils/helpers';
import { Plus, Search, Filter, X, Trash2, ListTodo, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Priority, Status, TaskFilters } from '../types';

function CreateTaskModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createTask = useCreateTask();
  const { data: usersRes } = useUsers();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<Status>('TODO');
  const [dueDate, setDueDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);

  if (!open) return null;

  const users = usersRes?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    try {
      await createTask.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        dueDate: dueDate || undefined,
        assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined,
      });
      toast.success('Task created');
      setTitle(''); setDescription(''); setPriority('MEDIUM'); setStatus('TODO'); setDueDate(''); setAssigneeIds([]);
      onClose();
    } catch {
      toast.error('Failed to create task');
    }
  };

  const toggleAssignee = (id: string) => {
    setAssigneeIds(prev => prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold">Create Task</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-sm font-medium text-gray-700 mb-1">Title *</label>
            <input id="task-title" type="text" required value={title} onChange={e => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none" placeholder="Task title" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none" placeholder="Optional description" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select value={priority} onChange={e => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select value={status} onChange={e => setStatus(e.target.value as Status)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          {users.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignees</label>
              <div className="flex flex-wrap gap-2">
                {users.map((u) => (
                  <button key={u.id} type="button" onClick={() => toggleAssignee(u.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition ${
                      assigneeIds.includes(u.id)
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}>
                    <div className="w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-medium" style={{ backgroundColor: u.avatarColor }}>
                      {getInitials(u.name)}
                    </div>
                    {u.name}
                  </button>
                ))}
              </div>
            </div>
          )}
          <button type="submit" disabled={createTask.isPending}
            className="w-full py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {createTask.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Create Task
          </button>
        </form>
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState<TaskFilters>(() => {
    const overdue = searchParams.get('overdue') || undefined;
    const status = searchParams.get('status') || undefined;
    return {
      status: status as Status,
      overdue,
      sortBy: overdue ? 'dueDate' : 'createdAt',
      sortOrder: overdue ? 'asc' : undefined,
    };
  });
  const [showCreate, setShowCreate] = useState(false);
  const { data, isLoading } = useTasks(filters);
  const deleteTask = useDeleteTask();

  const tasks = data?.data.tasks || [];
  const pagination = data?.data.pagination;

  const updateFilter = (key: string, value: string | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined, page: 1 }));
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask.mutateAsync(id);
      toast.success('Task deleted');
    } catch {
      toast.error('Failed to delete task');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ListTodo className="w-6 h-6" /> Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{pagination?.total || 0} total tasks</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Search tasks..." value={filters.search || ''} onChange={e => updateFilter('search', e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <select value={filters.status || ''} onChange={e => updateFilter('status', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Status</option>
            {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filters.priority || ''} onChange={e => updateFilter('priority', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="">All Priority</option>
            {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <select value={filters.sortBy || 'createdAt'} onChange={e => updateFilter('sortBy', e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
            <option value="createdAt">Created</option>
            <option value="updatedAt">Updated</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="title">Title</option>
          </select>
          <button onClick={() => updateFilter('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50">
            {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
          </button>
          {filters.overdue === 'true' && (
            <span className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg">
              Overdue
            </span>
          )}
          {(filters.search || filters.status || filters.priority || filters.overdue) && (
            <button onClick={() => setFilters({})} className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              <X className="w-3 h-3" /> Clear
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      ) : tasks.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Filter className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No tasks found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters or create a new task</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition group">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link to={`/tasks/${task.id}`} className="font-medium text-gray-900 hover:text-indigo-600 transition truncate">
                      {task.title}
                    </Link>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}>
                      {statusConfig[task.status].label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}>
                      {priorityConfig[task.priority].label}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    {task.dueDate && (
                      <span className={isOverdue(task.dueDate) ? 'text-red-500 font-medium' : ''}>
                        Due: {formatDate(task.dueDate)}
                      </span>
                    )}
                    <span>Updated: {formatDate(task.updatedAt)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex -space-x-2">
                    {task.assignees.slice(0, 3).map(a => (
                      <div key={a.user.id} className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-medium border-2 border-white" style={{ backgroundColor: a.user.avatarColor }}>
                        {getInitials(a.user.name)}
                      </div>
                    ))}
                  </div>
                  {task._count.comments > 0 && <span className="text-xs text-gray-400">💬 {task._count.comments}</span>}
                  <button onClick={() => handleDelete(task.id)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(p => (
            <button key={p} onClick={() => setFilters(prev => ({ ...prev, page: p }))}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                p === pagination.page ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {p}
            </button>
          ))}
        </div>
      )}

      <CreateTaskModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  );
}

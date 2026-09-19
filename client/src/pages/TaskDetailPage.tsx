import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTask, useUpdateTask, useDeleteTask, useComments, useCreateComment, useUpdateComment, useDeleteComment, useActivities, useUploadAttachment, useUsers } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { joinTaskRoom, leaveTaskRoom } from '../services/socket';
import { priorityConfig, statusConfig, formatDate, formatRelativeTime, formatFileSize, getInitials, isOverdue } from '../utils/helpers';
import { ArrowLeft, Edit3, Trash2, Paperclip, Send, Download, Clock, MessageSquare, Activity, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Priority, Status } from '../types';

function InlineEditTitle({ task, onSave }: { task: { id: string; title: string }; onSave: (title: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(task.title);
  const updateTask = useUpdateTask();

  const save = async () => {
    if (!value.trim() || value === task.title) { setEditing(false); return; }
    try {
      await updateTask.mutateAsync({ id: task.id, data: { title: value.trim() } });
      onSave(value.trim());
      setEditing(false);
      toast.success('Title updated');
    } catch { toast.error('Failed to update'); }
  };

  if (editing) {
    return (
      <input autoFocus value={value} onChange={e => setValue(e.target.value)} onBlur={save}
        onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setEditing(false); setValue(task.title); } }}
        className="text-2xl font-bold w-full border-b-2 border-indigo-500 outline-none bg-transparent py-1" />
    );
  }
  return (
    <h1 className="text-2xl font-bold flex items-center gap-2 group cursor-pointer" onClick={() => setEditing(true)}>
      {task.title}
      <Edit3 className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />
    </h1>
  );
}

function CommentSection({ taskId }: { taskId: string }) {
  const { user } = useAuth();
  const { data: commentsRes } = useComments(taskId);
  const createComment = useCreateComment();
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const comments = commentsRes?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    try {
      await createComment.mutateAsync({ taskId, content: content.trim() });
      setContent('');
    } catch { toast.error('Failed to add comment'); }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await updateComment.mutateAsync({ commentId, content: editContent.trim() });
      setEditingId(null);
      toast.success('Comment updated');
    } catch { toast.error('Failed to update comment'); }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete comment?')) return;
    try {
      await deleteComment.mutateAsync(commentId);
      toast.success('Comment deleted');
    } catch { toast.error('Failed to delete comment'); }
  };

  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments ({comments.length})</h3>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input value={content} onChange={e => setContent(e.target.value)} placeholder="Add a comment..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none" />
        <button type="submit" disabled={!content.trim()} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition">
          <Send className="w-4 h-4" />
        </button>
      </form>
      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="flex gap-3 group">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0" style={{ backgroundColor: c.user.avatarColor }}>
              {getInitials(c.user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{c.user.name}</span>
                <span className="text-xs text-gray-400">{formatRelativeTime(c.createdAt)}</span>
                {c.userId === user?.id && (
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => { setEditingId(c.id); setEditContent(c.content); }} className="text-gray-400 hover:text-indigo-600"><Edit3 className="w-3 h-3" /></button>
                    <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
              {editingId === c.id ? (
                <div className="mt-1">
                  <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" />
                  <div className="flex gap-2 mt-1">
                    <button onClick={() => handleUpdate(c.id)} className="px-3 py-1 text-xs bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">Save</button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700">Cancel</button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{c.content}</p>
              )}
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No comments yet</p>}
      </div>
    </div>
  );
}

function AttachmentSection({ taskId }: { taskId: string }) {
  const { data: taskRes } = useTask(taskId);
  const uploadAttachment = useUploadAttachment();
  const [uploading, setUploading] = useState(false);

  const attachments = taskRes?.data?.attachments || [];

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error('File too large (max 10MB)'); return; }
    setUploading(true);
    try {
      await uploadAttachment.mutateAsync({ taskId, file });
      toast.success('File uploaded');
    } catch { toast.error('Upload failed'); }
    setUploading(false);
    e.target.value = '';
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2"><Paperclip className="w-4 h-4" /> Attachments ({attachments.length})</h3>
      <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition text-sm text-gray-500">
        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Paperclip className="w-4 h-4" />}
        {uploading ? 'Uploading...' : 'Click to upload a file'}
        <input type="file" className="hidden" onChange={handleUpload} accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx,.txt,.csv,.xlsx,.zip" />
      </label>
      <div className="space-y-2">
        {attachments.map(a => (
          <div key={a.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3 min-w-0">
              <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{a.originalName}</p>
                <p className="text-xs text-gray-400">{formatFileSize(a.size)}</p>
              </div>
            </div>
            <a href={`/api/v1/uploads/${a.filename}`} download className="p-1 text-gray-400 hover:text-indigo-600">
              <Download className="w-4 h-4" />
            </a>
          </div>
        ))}
        {attachments.length === 0 && <p className="text-gray-400 text-sm text-center py-2">No attachments</p>}
      </div>
    </div>
  );
}

function ActivitySection({ taskId }: { taskId: string }) {
  const { data: activitiesRes } = useActivities(taskId);
  const activities = activitiesRes?.data || [];

  const actionLabels: Record<string, string> = {
    TASK_CREATED: 'created this task',
    TASK_UPDATED: 'updated this task',
    STATUS_CHANGED: 'changed status',
    PRIORITY_CHANGED: 'changed priority',
    ASSIGNEES_UPDATED: 'updated assignees',
    COMMENT_ADDED: 'added a comment',
    COMMENT_DELETED: 'deleted a comment',
    ATTACHMENT_UPLOADED: 'uploaded an attachment',
    ATTACHMENT_DELETED: 'deleted an attachment',
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold flex items-center gap-2"><Activity className="w-4 h-4" /> Activity</h3>
      <div className="space-y-3">
        {activities.map(a => (
          <div key={a.id} className="flex gap-3">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium shrink-0" style={{ backgroundColor: a.user.avatarColor }}>
              {getInitials(a.user.name)}
            </div>
            <div className="min-w-0">
              <p className="text-sm"><span className="font-medium">{a.user.name}</span> {actionLabels[a.action] || a.action}</p>
              <p className="text-xs text-gray-400">{formatRelativeTime(a.createdAt)}</p>
            </div>
          </div>
        ))}
        {activities.length === 0 && <p className="text-gray-400 text-sm text-center py-4">No activity yet</p>}
      </div>
    </div>
  );
}

export default function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: taskRes, isLoading } = useTask(id!);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const { data: usersRes } = useUsers();

  useEffect(() => {
    if (id) {
      joinTaskRoom(id);
      return () => leaveTaskRoom(id);
    }
  }, [id]);

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const task = taskRes?.data;
  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Task not found</p>
        <Link to="/tasks" className="text-indigo-600 hover:underline">Back to tasks</Link>
      </div>
    );
  }

  const users = usersRes?.data || [];
  const assigneeIds = task.assignees.map(a => a.user.id);

  const handleStatusChange = async (status: Status) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { status } });
      toast.success('Status updated');
    } catch { toast.error('Failed to update status'); }
  };

  const handlePriorityChange = async (priority: Priority) => {
    try {
      await updateTask.mutateAsync({ id: task.id, data: { priority } });
      toast.success('Priority updated');
    } catch { toast.error('Failed to update priority'); }
  };

  const handleAssigneeToggle = async (userId: string) => {
    const newIds = assigneeIds.includes(userId) ? assigneeIds.filter(id => id !== userId) : [...assigneeIds, userId];
    try {
      await updateTask.mutateAsync({ id: task.id, data: { assigneeIds: newIds } });
      toast.success('Assignees updated');
    } catch { toast.error('Failed to update assignees'); }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask.mutateAsync(task.id);
      toast.success('Task deleted');
      navigate('/tasks');
    } catch { toast.error('Failed to delete task'); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/tasks" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4" /> Back to tasks
      </Link>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <InlineEditTitle task={task} onSave={() => {}} />
            <p className="text-sm text-gray-500 mt-1">Created by {task.creator.name} on {formatDate(task.createdAt)}</p>
          </div>
          {task.creatorId === user?.id && (
            <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Status</label>
            <select value={task.status} onChange={e => handleStatusChange(e.target.value as Status)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              {Object.entries(statusConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Priority</label>
            <select value={task.priority} onChange={e => handlePriorityChange(e.target.value as Priority)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none">
              {Object.entries(priorityConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Due Date</label>
            <input type="date" value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
              onChange={e => updateTask.mutate({ id: task.id, data: { dueDate: e.target.value || null } })}
              className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none ${
                task.dueDate && isOverdue(task.dueDate) ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Updated</label>
            <p className="text-sm text-gray-600 flex items-center gap-1 py-2"><Clock className="w-4 h-4" /> {formatRelativeTime(task.updatedAt)}</p>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Description</label>
          <textarea value={task.description || ''} rows={3}
            onBlur={e => { if (e.target.value !== (task.description || '')) updateTask.mutate({ id: task.id, data: { description: e.target.value || null } }); }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Add a description..." />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-2 uppercase tracking-wide">Assignees</label>
          <div className="flex flex-wrap gap-2">
            {users.map(u => (
              <button key={u.id} onClick={() => handleAssigneeToggle(u.id)}
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
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <AttachmentSection taskId={task.id} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <CommentSection taskId={task.id} />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ActivitySection taskId={task.id} />
      </div>
    </div>
  );
}

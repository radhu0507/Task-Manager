import { useDashboard } from '../hooks/useApi';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { LayoutDashboard, CheckCircle, Clock, AlertTriangle, AlertCircle, Plus, ArrowRight } from 'lucide-react';
import { priorityConfig, statusConfig, formatDate, isOverdue } from '../utils/helpers';
import type { Task } from '../types';

function StatCard({ icon: Icon, label, value, color, to }: { icon: React.ElementType; label: string; value: number; color: string; to?: string }) {
  const content = (
    <>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </>
  );
  const className = "bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4 hover:shadow-sm hover:border-indigo-200 transition";
  return to ? <Link to={to} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

function TaskRow({ task }: { task: Task }) {
  return (
    <Link to={`/tasks/${task.id}`} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition group">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusConfig[task.status].bg} ${statusConfig[task.status].color}`}>
          {statusConfig[task.status].label}
        </span>
        <span className="font-medium text-sm truncate group-hover:text-indigo-600 transition">{task.title}</span>
      </div>
      <div className="flex items-center gap-3 text-sm text-gray-500 shrink-0">
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig[task.priority].bg} ${priorityConfig[task.priority].color}`}>
          {priorityConfig[task.priority].label}
        </span>
        {task.dueDate && (
          <span className={isOverdue(task.dueDate) ? 'text-red-500 font-medium' : ''}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading } = useDashboard(user?.id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-gray-200 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><LayoutDashboard className="w-6 h-6" /> Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Overview of your tasks</p>
        </div>
        <Link to="/tasks" className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4" /> New Task
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard icon={LayoutDashboard} label="Total" value={data.total} color="bg-indigo-100 text-indigo-600" to="/tasks" />
        <StatCard icon={Clock} label="To Do" value={data.todo} color="bg-gray-100 text-gray-600" to="/tasks?status=TODO" />
        <StatCard icon={AlertCircle} label="In Progress" value={data.inProgress} color="bg-blue-100 text-blue-600" to="/tasks?status=IN_PROGRESS" />
        <StatCard icon={CheckCircle} label="Completed" value={data.completed} color="bg-green-100 text-green-600" to="/tasks?status=COMPLETED" />
        <StatCard icon={AlertTriangle} label="Overdue" value={data.overdue} color="bg-red-100 text-red-600" to="/tasks?overdue=true" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Tasks</h2>
            <Link to="/tasks" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
          </div>
          <div className="space-y-1">
            {data.recentTasks.length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No tasks yet</p>
            ) : (
              data.recentTasks.map(t => <TaskRow key={t.id} task={t} />)
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">High Priority</h2>
            <span className="text-sm text-orange-600 font-medium">{data.highPriority} tasks</span>
          </div>
          <div className="space-y-1">
            {data.recentTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').slice(0, 5).length === 0 ? (
              <p className="text-gray-400 text-sm py-4 text-center">No high priority tasks</p>
            ) : (
              data.recentTasks.filter(t => t.priority === 'HIGH' || t.priority === 'URGENT').slice(0, 5).map(t => <TaskRow key={t.id} task={t} />)
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">My Tasks</h2>
          <Link to="/tasks" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">View all <ArrowRight className="w-3 h-3" /></Link>
        </div>
        <div className="space-y-1">
          {data.myTasks.length === 0 ? (
            <p className="text-gray-400 text-sm py-4 text-center">No tasks assigned to you yet</p>
          ) : (
            data.myTasks.map(t => <TaskRow key={t.id} task={t} />)
          )}
        </div>
      </div>
    </div>
  );
}

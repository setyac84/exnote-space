import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProjects, mockTasks, mockUsers, mockCompanies } from '@/data/mock';
import { Task, TaskStatus, TaskPriority } from '@/types';
import TaskModal from '@/components/TaskModal';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatDate';
import { useSearchParams } from 'react-router-dom';
import { List, LayoutGrid, Plus, ChevronDown } from 'lucide-react';

const priorityDot: Record<string, string> = {
  low: 'bg-muted-foreground',
  medium: 'bg-info',
  high: 'bg-warning',
  urgent: 'bg-destructive',
};

const priorityLabel: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-info',
  high: 'text-warning',
  urgent: 'text-destructive',
};

const statusLabel: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  review: 'Review',
  done: 'Done',
};

const statusDot: Record<TaskStatus, string> = {
  todo: 'border-muted-foreground',
  doing: 'border-info',
  review: 'border-warning',
  done: 'border-success bg-success',
};

const InlineStatusDropdown = ({ value, onChange, dropUp = false }: { value: TaskStatus; onChange: (s: TaskStatus) => void; dropUp?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className={cn('w-3 h-3 rounded-full border-2 shrink-0', statusDot[value])} />
        {statusLabel[value]}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={cn(
            'absolute right-0 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 min-w-[120px]',
            dropUp ? 'bottom-full mb-1' : 'top-full mt-1'
          )}>
            {(Object.keys(statusLabel) as TaskStatus[]).map(s => (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors',
                  value === s && 'font-medium'
                )}
              >
                <span className={cn('w-3 h-3 rounded-full border-2 shrink-0', statusDot[s])} />
                {statusLabel[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TaskListPage = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'card'>('card');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const statusFilter = searchParams.get('status') as TaskStatus | null;
  const memberFilter = searchParams.get('member');
  const priorityFilter = searchParams.get('priority');
  const projectFilter = searchParams.get('project');

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    let filtered = tasks.filter(t => {
      const project = mockProjects.find(p => p.id === t.project_id);
      return project?.division === activeDivision;
    });
    if (!isAdmin) filtered = filtered.filter(t => t.assignee_id === user.id);
    if (statusFilter) filtered = filtered.filter(t => t.status === statusFilter);
    if (memberFilter) filtered = filtered.filter(t => t.assignee_id === memberFilter);
    if (priorityFilter) {
      const priorities = priorityFilter.split(',');
      filtered = filtered.filter(t => priorities.includes(t.priority));
    }
    if (projectFilter) filtered = filtered.filter(t => t.project_id === projectFilter);
    filtered.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
    });
    return filtered;
  }, [tasks, activeDivision, isAdmin, isSuperAdmin, user, statusFilter, memberFilter, priorityFilter, projectFilter]);

  if (!user) return null;

  const handleUpdate = (updated: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === updated.id);
      if (exists) return prev.map(t => t.id === updated.id ? updated : t);
      return [...prev, updated];
    });
    setSelectedTask(null);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDelete = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(null);
  };

  const getProjectCompany = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    if (!project) return { projectName: '-', companyName: '-' };
    const company = mockCompanies.find(c => c.id === project.company_id);
    return { projectName: project.name, companyName: company?.name || '-' };
  };

  let title = 'All Tasks';
  if (statusFilter) title = `Tasks: ${statusLabel[statusFilter]}`;
  if (memberFilter) {
    const m = mockUsers.find(u => u.id === memberFilter);
    title = `Tasks by ${m?.name || ''}`;
  }
  if (priorityFilter) title = 'High Priority Tasks';
  if (projectFilter) {
    const p = mockProjects.find(pr => pr.id === projectFilter);
    title = `Tasks: ${p?.name || ''}`;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{filteredTasks.length} tasks found</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
          <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={cn('p-2 rounded-md transition-colors', viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={cn('p-2 rounded-md transition-colors', viewMode === 'card' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {viewMode === 'list' ? (
        <div className="glass-card rounded-xl overflow-hidden">
          {/* Header - desktop only */}
          <div className="hidden lg:grid grid-cols-[140px_1fr_1.5fr_90px_90px_110px_110px] gap-2 px-4 py-2.5 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            <span>Project · Company</span>
            <span>Task</span>
            <span>Description</span>
            <span>Priority</span>
            <span>Due Date</span>
            <span>Status</span>
            <span>Assignee</span>
          </div>
          {filteredTasks.map((task, i) => {
            const assignee = mockUsers.find(u => u.id === task.assignee_id);
            const { projectName, companyName } = getProjectCompany(task.project_id);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                onClick={() => setSelectedTask(task)}
                className="cursor-pointer transition-colors"
              >
                {/* Desktop row */}
                <div className="hidden lg:grid grid-cols-[140px_1fr_1.5fr_90px_90px_110px_110px] gap-2 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 items-center">
                  <span className="text-[10px] text-muted-foreground">{projectName} · {companyName}</span>
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[task.priority])} />
                    <span className="text-sm text-foreground font-medium">{task.title}</span>
                  </div>
                  <span className="text-xs text-muted-foreground line-clamp-2">{task.description}</span>
                  <span className={cn('text-xs capitalize', priorityLabel[task.priority])}>{task.priority}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                  <InlineStatusDropdown value={task.status} onChange={(s) => handleStatusChange(task.id, s)} />
                  <span className="text-xs text-muted-foreground truncate">{assignee?.name.split(' ')[0]}</span>
                </div>
                {/* Mobile card */}
                <div className="lg:hidden p-3 border-b border-border/50 hover:bg-secondary/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-foreground">{task.title}</span>
                    <span className={cn('text-[10px] capitalize font-medium', priorityLabel[task.priority])}>{task.priority}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{task.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{assignee?.name.split(' ')[0]} · {formatDate(task.due_date)}</span>
                    <InlineStatusDropdown value={task.status} onChange={(s) => handleStatusChange(task.id, s)} />
                  </div>
                </div>
              </motion.div>
            );
          })}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">No tasks found.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, i) => {
            const assignee = mockUsers.find(u => u.id === task.assignee_id);
            const { projectName, companyName } = getProjectCompany(task.project_id);
            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedTask(task)}
                className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all overflow-visible"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground">
                    {projectName} · {companyName}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[task.priority])} />
                    <span className={cn('text-[10px] font-medium capitalize', priorityLabel[task.priority])}>{task.priority}</span>
                  </div>
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">{task.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{task.description}</p>

                <div className="flex items-center text-[10px] text-muted-foreground mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                      {assignee?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{assignee?.name.split(' ')[0]}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground">{formatDate(task.due_date)}</span>
                  <InlineStatusDropdown value={task.status} onChange={(s) => handleStatusChange(task.id, s)} />
                </div>
              </motion.div>
            );
          })}
          {filteredTasks.length === 0 && (
            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground text-sm">No tasks found.</div>
          )}
        </div>
      )}

      <TaskModal
        task={selectedTask}
        division={activeDivision}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdate}
        onDelete={isAdmin ? handleDelete : undefined}
        readOnly={!isAdmin}
      />

      <TaskModal
        task={null}
        division={activeDivision}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUpdate={handleUpdate}
        mode="create"
        projectId={projectFilter || ''}
      />
    </div>
  );
};

export default TaskListPage;

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProjects, mockTasks, mockUsers, mockCompanies } from '@/data/mock';
import { Task, TaskStatus, TaskPriority } from '@/types';
import TaskModal from '@/components/TaskModal';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { List, LayoutGrid, Plus } from 'lucide-react';

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

const TaskListPage = () => {
  const { user, activeDivision } = useAuth();
  const [searchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const statusFilter = searchParams.get('status') as TaskStatus | null;
  const memberFilter = searchParams.get('member');
  const priorityFilter = searchParams.get('priority');
  const projectFilter = searchParams.get('project');

  const isAdmin = user?.role === 'admin';

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
    return filtered;
  }, [tasks, activeDivision, isAdmin, user, statusFilter, memberFilter, priorityFilter, projectFilter]);

  if (!user) return null;

  const handleUpdate = (updated: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === updated.id);
      if (exists) return prev.map(t => t.id === updated.id ? updated : t);
      return [...prev, updated];
    });
    setSelectedTask(null);
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

  // Build title
  let title = 'Semua Task';
  if (statusFilter) title = `Task: ${statusLabel[statusFilter]}`;
  if (memberFilter) {
    const m = mockUsers.find(u => u.id === memberFilter);
    title = `Task ${m?.name || ''}`;
  }
  if (priorityFilter) title = 'Task Prioritas Tinggi';
  if (projectFilter) {
    const p = mockProjects.find(pr => pr.id === projectFilter);
    title = `Task: ${p?.name || ''}`;
  }

  return (
    <div className="max-w-6xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1">{filteredTasks.length} task ditemukan</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> Tambah Task
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
          {/* Header */}
          <div className="grid grid-cols-[1fr_150px_120px_100px_90px_90px_100px] gap-2 px-4 py-2.5 border-b border-border text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
            <span>Task</span>
            <span>Project - Company</span>
            <span>Assignee</span>
            <span>Priority</span>
            <span>Status</span>
            <span>Due Date</span>
            <span>Description</span>
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
                className="grid grid-cols-[1fr_150px_120px_100px_90px_90px_100px] gap-2 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors items-center"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[task.priority])} />
                  <span className="text-sm text-foreground truncate">{task.title}</span>
                </div>
                <span className="text-[10px] text-muted-foreground truncate">{projectName} · {companyName}</span>
                <span className="text-xs text-muted-foreground truncate">{assignee?.name.split(' ')[0]}</span>
                <span className={cn('text-xs capitalize', priorityLabel[task.priority])}>{task.priority}</span>
                <span className="text-xs text-muted-foreground">{statusLabel[task.status]}</span>
                <span className="text-xs text-muted-foreground">{task.due_date?.slice(5)}</span>
                <span className="text-[10px] text-muted-foreground truncate">{task.description}</span>
              </motion.div>
            );
          })}
          {filteredTasks.length === 0 && (
            <div className="text-center py-12 text-muted-foreground text-sm">Tidak ada task.</div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
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
                className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all"
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[task.priority])} />
                  <span className={cn('text-[10px] font-medium capitalize', priorityLabel[task.priority])}>{task.priority}</span>
                  <span className="text-[10px] text-muted-foreground ml-auto">{statusLabel[task.status]}</span>
                </div>
                <h3 className="text-sm font-medium text-foreground mb-1">{task.title}</h3>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{task.description}</p>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                      {assignee?.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <span>{assignee?.name.split(' ')[0]}</span>
                  </div>
                  <span>{task.due_date}</span>
                </div>

                <p className="text-[10px] text-muted-foreground pt-2 border-t border-border/50 truncate">
                  {projectName} · {companyName}
                </p>
              </motion.div>
            );
          })}
          {filteredTasks.length === 0 && (
            <div className="col-span-3 text-center py-12 text-muted-foreground text-sm">Tidak ada task.</div>
          )}
        </div>
      )}

      {/* View/Edit Task Modal */}
      <TaskModal
        task={selectedTask}
        division={activeDivision}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdate}
        onDelete={isAdmin ? handleDelete : undefined}
        readOnly={!isAdmin}
      />

      {/* Create Task Modal */}
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

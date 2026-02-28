import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useTasks, useMembers, useUpdateTask, useDeleteTask, useTaskAssignees } from '@/hooks/useSupabaseData';
import TaskModal from '@/components/TaskModal';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';

const columns: { status: TaskStatus; label: string; className: string }[] = [
  { status: 'todo', label: 'To Do', className: 'kanban-col-todo' },
  { status: 'doing', label: 'Doing', className: 'kanban-col-doing' },
  { status: 'review', label: 'Review', className: 'bg-secondary' },
  { status: 'done', label: 'Done', className: 'kanban-col-done' },
];

const priorityDot: Record<string, string> = {
  low: 'bg-muted-foreground', medium: 'bg-info', high: 'bg-warning', urgent: 'bg-destructive',
};

const KanbanBoard = () => {
  const { user, activeDivision, isAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: allProjects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: allMembers = [] } = useMembers();
  const { data: allTaskAssignees = [] } = useTaskAssignees();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    let filtered = allTasks.filter(t => {
      const project = allProjects.find(p => p.id === t.project_id);
      return project?.division === activeDivision;
    });
    if (projectFilter) filtered = filtered.filter(t => t.project_id === projectFilter);
    if (!isAdmin) {
      filtered = filtered.filter(t => {
        const taskAssigneeIds = allTaskAssignees.filter(ta => ta.task_id === t.id).map(ta => ta.assignee_id);
        return taskAssigneeIds.includes(user.id) || t.assignee_id === user.id;
      });
    }
    return filtered;
  }, [allTasks, allProjects, activeDivision, projectFilter, isAdmin, user, allTaskAssignees]);

  if (!user) return null;

  const currentProject = projectFilter ? allProjects.find(p => p.id === projectFilter) : null;

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTask.mutate({ id: taskId, status: newStatus });
  };

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {currentProject ? currentProject.name : 'Kanban Board'}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{filteredTasks.length} tasks</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map(col => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);
          return (
            <motion.div key={col.status} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={cn('rounded-xl p-3 min-h-[200px]', col.className)}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-foreground uppercase tracking-wide">{col.label}</h3>
                <span className="text-[10px] font-medium text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">{colTasks.length}</span>
              </div>
              <div className="space-y-2">
                {colTasks.map(task => {
                  const taskAssigneeIds = allTaskAssignees.filter(ta => ta.task_id === task.id).map(ta => ta.assignee_id);
                  const assignees = taskAssigneeIds.length > 0
                    ? taskAssigneeIds.map(id => allMembers.find(u => u.id === id)).filter(Boolean)
                    : (task.assignee_id ? [allMembers.find(u => u.id === task.assignee_id)].filter(Boolean) : []);
                  return (
                    <motion.div key={task.id} layout onClick={() => setSelectedTask(task)}
                      className="bg-card border border-border/60 rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-all shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[task.priority])} />
                        <span className="text-[10px] text-muted-foreground capitalize">{task.priority}</span>
                      </div>
                      <h4 className="text-sm font-medium text-foreground mb-1 line-clamp-2">{task.title}</h4>
                      {assignees.length > 0 && (
                        <div className="flex items-center gap-1 mt-2">
                          <div className="flex -space-x-1.5">
                            {assignees.slice(0, 3).map((a: any) => (
                              <div key={a.id} className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary border border-card">
                                {a.name.split(' ').map((n: string) => n[0]).join('')}
                              </div>
                            ))}
                          </div>
                          <span className="text-[10px] text-muted-foreground ml-1">
                            {assignees.length <= 2 ? assignees.map((a: any) => a.name.split(' ')[0]).join(', ') : `${assignees.length} assignees`}
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      <TaskModal task={selectedTask} division={activeDivision} isOpen={!!selectedTask} onClose={() => setSelectedTask(null)}
        onDelete={isAdmin ? (id) => { deleteTask.mutate(id); setSelectedTask(null); } : undefined} readOnly={!isAdmin} />

      <TaskModal task={null} division={activeDivision} isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}
        mode="create" projectId={projectFilter || ''} />
    </div>
  );
};

export default KanbanBoard;

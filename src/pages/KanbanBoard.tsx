import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProjects, mockTasks, mockUsers } from '@/data/mock';
import { Task, TaskStatus } from '@/types';
import TaskModal from '@/components/TaskModal';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';

const columns: { status: TaskStatus; label: string; className: string }[] = [
  { status: 'todo', label: 'To Do', className: 'kanban-col-todo' },
  { status: 'doing', label: 'Doing', className: 'kanban-col-doing' },
  { status: 'review', label: 'Review', className: 'bg-secondary' },
  { status: 'done', label: 'Done', className: 'kanban-col-done' },
];

const priorityDot: Record<string, string> = {
  low: 'bg-muted-foreground',
  medium: 'bg-info',
  high: 'bg-warning',
  urgent: 'bg-destructive',
};

const KanbanBoard = () => {
  const { user, activeDivision } = useAuth();
  const [searchParams] = useSearchParams();
  const projectFilter = searchParams.get('project');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const isAdmin = user?.role === 'admin';

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    let filtered = tasks.filter(t => {
      const project = mockProjects.find(p => p.id === t.project_id);
      return project?.division === activeDivision;
    });
    if (projectFilter) filtered = filtered.filter(t => t.project_id === projectFilter);
    if (!isAdmin) filtered = filtered.filter(t => t.assignee_id === user.id);
    return filtered;
  }, [tasks, activeDivision, projectFilter, isAdmin, user]);

  if (!user) return null;

  const currentProject = projectFilter ? mockProjects.find(p => p.id === projectFilter) : null;

  const handleUpdateTask = (updated: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === updated.id);
      if (exists) return prev.map(t => t.id === updated.id ? updated : t);
      return [...prev, updated];
    });
    setSelectedTask(null);
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(null);
  };

  return (
    <div>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {currentProject ? currentProject.name : 'Kanban Board'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {currentProject ? currentProject.description : `Semua task divisi ${activeDivision}`}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" /> Tambah Task
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-4 gap-4">
        {columns.map((col, colIdx) => {
          const colTasks = filteredTasks.filter(t => t.status === col.status);
          return (
            <motion.div
              key={col.status}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: colIdx * 0.08 }}
              className={cn('rounded-xl p-3 min-h-[60vh]', col.className)}
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                  <span className="text-[10px] bg-background/50 text-muted-foreground px-1.5 py-0.5 rounded-md font-medium">
                    {colTasks.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {colTasks.map((task, i) => {
                  const assignee = mockUsers.find(u => u.id === task.assignee_id);
                  const project = mockProjects.find(p => p.id === task.project_id);

                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: colIdx * 0.08 + i * 0.04 }}
                      onClick={() => setSelectedTask(task)}
                      className="bg-card border border-border/50 rounded-lg p-3 cursor-pointer hover:border-primary/30 transition-all group"
                    >
                      <div className="flex items-start gap-2 mb-2">
                        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', priorityDot[task.priority])} />
                        <p className="text-sm text-foreground font-medium leading-snug">{task.title}</p>
                      </div>

                      {!projectFilter && project && (
                        <p className="text-[10px] text-muted-foreground mb-2 ml-4">{project.name}</p>
                      )}

                      <div className="flex items-center justify-between ml-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary">
                            {assignee?.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-[10px] text-muted-foreground">{assignee?.name.split(' ')[0]}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">{task.due_date.slice(5)}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* View/Edit Task Modal */}
      <TaskModal
        task={selectedTask}
        division={activeDivision}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={isAdmin ? handleDeleteTask : undefined}
        readOnly={!isAdmin}
      />

      {/* Create Task Modal */}
      <TaskModal
        task={null}
        division={activeDivision}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUpdate={handleUpdateTask}
        mode="create"
        projectId={projectFilter || ''}
      />
    </div>
  );
};

export default KanbanBoard;

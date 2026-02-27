import { useState } from 'react';
import { Task, Division, TaskStatus, TaskPriority } from '@/types';
import { mockUsers } from '@/data/mock';
import { X, Calendar, Flag, User, Link, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const priorityColors: Record<TaskPriority, string> = {
  low: 'text-muted-foreground bg-muted',
  medium: 'text-info bg-info/15',
  high: 'text-warning bg-warning/15',
  urgent: 'text-destructive bg-destructive/15',
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'doing', label: 'Doing' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

interface TaskModalProps {
  task: Task | null;
  division: Division;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  readOnly?: boolean;
}

const TaskModal = ({ task, division, isOpen, onClose, onUpdate, readOnly }: TaskModalProps) => {
  if (!task) return null;

  const assignee = mockUsers.find(u => u.id === task.assignee_id);
  const divisionMembers = mockUsers.filter(u => u.division === division);

  const handleStatusChange = (status: TaskStatus) => {
    onUpdate({ ...task, status });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', priorityColors[task.priority])}>
                      {task.priority.toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">{task.title}</h2>
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-5">
                {/* Description */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-1">Deskripsi</p>
                  <p className="text-sm text-foreground">{task.description}</p>
                </div>

                {/* Status */}
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Status</p>
                  <div className="flex gap-2">
                    {statusOptions.map(opt => (
                      <button
                        key={opt.value}
                        disabled={readOnly}
                        onClick={() => handleStatusChange(opt.value)}
                        className={cn(
                          'text-xs px-3 py-1.5 rounded-lg transition-colors',
                          task.status === opt.value
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
                          readOnly && 'opacity-60 cursor-not-allowed'
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Assignee</p>
                      <p className="text-sm text-foreground">{assignee?.name || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Flag className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Priority</p>
                      <p className="text-sm text-foreground capitalize">{task.priority}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">Start Date</p>
                      <p className="text-sm text-foreground">{task.start_date}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-[10px] text-muted-foreground">End Date</p>
                      <p className="text-sm text-foreground">{task.end_date}</p>
                    </div>
                  </div>
                </div>

                {/* Division-specific fields */}
                {division === 'creative' && (task.moodboard_link || task.aspect_ratio || task.brand_guidelines) && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Detail Creative</p>
                    <div className="space-y-2">
                      {task.moodboard_link && (
                        <div className="flex items-center gap-2 text-sm">
                          <Link className="w-3.5 h-3.5 text-muted-foreground" />
                          <a href={task.moodboard_link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{task.moodboard_link}</a>
                        </div>
                      )}
                      {task.aspect_ratio && (
                        <p className="text-sm text-foreground">Aspect Ratio: {task.aspect_ratio}</p>
                      )}
                    </div>
                  </div>
                )}

                {division === 'developer' && (task.repo_link || task.environment || task.bug_severity) && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Detail Developer</p>
                    <div className="space-y-2">
                      {task.repo_link && (
                        <div className="flex items-center gap-2 text-sm">
                          <Link className="w-3.5 h-3.5 text-muted-foreground" />
                          <a href={task.repo_link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{task.repo_link}</a>
                        </div>
                      )}
                      {task.environment && (
                        <p className="text-sm text-foreground capitalize">Environment: {task.environment}</p>
                      )}
                      {task.bug_severity && (
                        <div className="flex items-center gap-2 text-sm">
                          <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                          <span className="capitalize">Bug Severity: {task.bug_severity}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;

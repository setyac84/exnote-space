import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderKanban, CheckCircle2, Clock, ChevronDown, ChevronRight, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateRange, formatDaysLeft, daysLeftColor } from '@/lib/formatDate';
import { useUpdateProject } from '@/hooks/useSupabaseData';

const statusColors: Record<string, string> = {
  planning: 'bg-info/15 text-info',
  ongoing: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success',
  archived: 'bg-muted text-muted-foreground',
};

const priorityDot: Record<string, string> = {
  low: 'bg-muted-foreground', medium: 'bg-info', high: 'bg-warning', urgent: 'bg-destructive',
};

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

interface RunningProjectsProps {
  projects: any[];
  tasks: any[];
  companies: any[];
  isAdmin?: boolean;
  onNavigate: () => void;
  onViewTasks?: (projectId: string) => void;
}

const MiniProjectCard = ({ project, companyName, tasks, isAdmin, index, onViewTasks }: {
  project: any; companyName: string; tasks: any[]; isAdmin?: boolean; index: number; onViewTasks?: () => void;
}) => {
  const doneTasks = tasks.filter(t => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const updateProject = useUpdateProject();

  const [statusOpen, setStatusOpen] = useState(false);
  const statusRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (statusRef.current && !statusRef.current.contains(e.target as Node)) setStatusOpen(false);
    };
    if (statusOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [statusOpen]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
      className="glass-card rounded-xl flex flex-col overflow-hidden hover:border-primary/20 transition-all"
    >
      <div className="p-4 flex-1 space-y-3">
        {/* Header: company + status */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium truncate">{companyName}</p>
          {isAdmin ? (
            <div ref={statusRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => setStatusOpen(!statusOpen)}
                className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize inline-flex items-center gap-0.5', statusColors[project.status])}
              >
                {project.status}
                <ChevronDown className={cn("w-2.5 h-2.5 transition-transform", statusOpen && "rotate-180")} />
              </button>
              {statusOpen && (
                <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-xl shadow-xl z-[70] p-1 min-w-[110px]">
                  {statusOptions.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={() => { updateProject.mutate({ id: project.id, status: opt.value }); setStatusOpen(false); }}
                      className={cn('w-full text-left px-2.5 py-1.5 text-[11px] rounded-lg transition-colors capitalize',
                        project.status === opt.value ? 'font-medium bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize shrink-0', statusColors[project.status])}>{project.status}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{project.name}</h3>

        {/* Priority + Date */}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', priorityDot[project.priority])} />
          <span className="capitalize">{project.priority}</span>
          <span className="text-border">·</span>
          <span className="truncate">{formatDateRange(project.start_date, project.end_date)}</span>
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] text-muted-foreground">Progress</span>
            <span className="text-[10px] font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ delay: index * 0.08 + 0.2, duration: 0.5 }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground border-t border-border px-4 py-2">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>{doneTasks}/{totalTasks} tasks</span>
          </div>
          {formatDaysLeft(project.end_date) && (
            <div className={cn('flex items-center gap-0.5', daysLeftColor(project.end_date))}>
              <Clock className="w-2.5 h-2.5" />
              <span className="font-medium">{formatDaysLeft(project.end_date)}</span>
            </div>
          )}
        </div>
        {onViewTasks && (
          <button onClick={onViewTasks}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary transition-colors">
            View tasks <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

const RunningProjects = ({ projects, tasks, companies, isAdmin, onNavigate, onViewTasks }: RunningProjectsProps) => {
  const runningProjects = projects
    .filter(p => p.status === 'ongoing' || p.status === 'planning')
    .sort((a, b) => {
      const dateA = a.start_date ? new Date(a.start_date).getTime() : Infinity;
      const dateB = b.start_date ? new Date(b.start_date).getTime() : Infinity;
      return dateA - dateB;
    })
    .slice(0, 3);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Running Projects</h2>
        </div>
        <button onClick={onNavigate} className="text-xs text-primary hover:underline inline-flex items-center gap-0.5">
          View All <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {runningProjects.length === 0 ? (
        <div className="glass-card rounded-xl flex flex-col items-center justify-center py-10 text-center">
          <Inbox className="w-10 h-10 text-muted-foreground/30 mb-3" />
          <p className="text-sm font-semibold text-foreground">Project is empty</p>
          <p className="text-xs text-muted-foreground mt-1">No ongoing or planned projects yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {runningProjects.map((project, i) => {
            const company = companies.find((c: any) => c.id === project.company_id);
            const projectTasks = tasks.filter((t: any) => t.project_id === project.id);
            return (
              <MiniProjectCard
                key={project.id}
                project={project}
                companyName={company?.name || '-'}
                tasks={projectTasks}
                isAdmin={isAdmin}
                index={i}
                onViewTasks={onViewTasks ? () => onViewTasks(project.id) : undefined}
              />
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default RunningProjects;

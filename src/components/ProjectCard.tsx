import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Check, ChevronDown, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateRange, formatDaysLeft, daysLeftColor } from '@/lib/formatDate';

const priorityDot: Record<string, string> = { low: 'bg-muted-foreground', medium: 'bg-info', high: 'bg-warning', urgent: 'bg-destructive' };

const statusColors: Record<string, string> = {
  planning: 'bg-info/15 text-info', ongoing: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success', archived: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground', medium: 'text-info', high: 'text-warning', urgent: 'text-destructive',
};

const statusOptions = [
  { value: 'planning', label: 'Planning' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

interface ProjectCardProps {
  project: any;
  companyName: string;
  index: number;
  onClick: () => void;
  onNavigate?: () => void;
  showArchiveCheckbox?: boolean;
  isArchived?: boolean;
  onArchiveToggle?: () => void;
  onStatusChange?: (status: string) => void;
  isAdmin?: boolean;
}

const ProjectCard = ({ project, companyName, index, onClick, onNavigate, showArchiveCheckbox, isArchived, onArchiveToggle, onStatusChange, isAdmin }: ProjectCardProps) => {
  const tasks = project.tasks || [];
  const doneTasks = tasks.filter((t: any) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
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
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.35 }}
      onClick={onClick} className="glass-card rounded-xl cursor-pointer hover:border-primary/30 transition-all group flex flex-col">
      
      {/* Main content area */}
      <div className="p-5 pb-3 flex-1">
        {/* Top row: company name + status dropdown */}
        <div className="flex items-start justify-between mb-1">
          <p className="text-[10px] text-muted-foreground">{companyName}</p>
          {isAdmin && onStatusChange ? (
            <div ref={statusRef} className="relative">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setStatusOpen(!statusOpen); }}
                className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full capitalize inline-flex items-center gap-1', statusColors[project.status])}
              >
                {project.status}
                <ChevronDown className={cn("w-3 h-3 transition-transform", statusOpen && "rotate-180")} />
              </button>
              {statusOpen && (
                <div className="absolute top-full right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl z-[70] p-1.5 min-w-[120px] space-y-0.5">
                  {statusOptions.map(opt => (
                    <button key={opt.value} type="button"
                      onClick={(e) => { e.stopPropagation(); onStatusChange(opt.value); setStatusOpen(false); }}
                      className={cn('w-full text-left px-2.5 py-2 text-[11px] rounded-lg transition-colors capitalize',
                        project.status === opt.value ? 'font-medium bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60')}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <span className={cn('text-[11px] font-medium px-2.5 py-1 rounded-full capitalize', statusColors[project.status])}>{project.status}</span>
          )}
        </div>

        {/* Title */}
        <h3 className="font-semibold text-primary group-hover:text-primary/80 transition-colors text-base mb-1">{project.name}</h3>
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

        {/* Priority + Date row + checkbox */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[project.priority])} />
              <span className={cn('font-medium capitalize', priorityColors[project.priority])}>{project.priority}</span>
            </span>
            <span>·</span>
            <span>{formatDateRange(project.start_date, project.end_date)}</span>
          </div>
          {showArchiveCheckbox && onArchiveToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchiveToggle(); }}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0",
                isArchived
                  ? 'border-primary bg-primary/20 hover:border-destructive hover:bg-transparent'
                  : 'border-muted-foreground/40 hover:border-primary'
              )}
              title={isArchived ? 'Unarchive this project' : 'Archive this project'}
            >
              <Check className={cn('w-3 h-3', isArchived ? 'text-primary' : 'text-transparent hover:text-primary')} />
            </button>
          )}
        </div>

        {/* Progress */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[11px] text-muted-foreground">Progress</span>
            <span className="text-[11px] font-medium text-foreground">{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
              className="h-full rounded-full bg-primary" />
          </div>
        </div>
      </div>

      {/* Footer with border-top */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-border px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{doneTasks}/{totalTasks} tasks</span>
          </div>
          {formatDaysLeft(project.end_date) && (
            <div className={cn('flex items-center gap-1', daysLeftColor(project.end_date))}>
              <Clock className="w-3 h-3" />
              <span className="font-medium">{formatDaysLeft(project.end_date)}</span>
            </div>
          )}
        </div>
        {onNavigate && (
          <button onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-primary transition-colors">
            View tasks <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectCard;

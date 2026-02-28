import { motion } from 'framer-motion';
import { CheckCircle2, ArrowRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDateRange } from '@/lib/formatDate';

const statusColors: Record<string, string> = {
  planning: 'bg-info/15 text-info', ongoing: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success', archived: 'bg-muted text-muted-foreground',
};

const priorityColors: Record<string, string> = {
  low: 'text-muted-foreground', medium: 'text-info', high: 'text-warning', urgent: 'text-destructive',
};

interface ProjectCardProps {
  project: any;
  companyName: string;
  index: number;
  onClick: () => void;
  onNavigate?: () => void;
  showArchiveCheckbox?: boolean;
  isArchived?: boolean;
  onArchiveToggle?: () => void;
}

const ProjectCard = ({ project, companyName, index, onClick, onNavigate, showArchiveCheckbox, isArchived, onArchiveToggle }: ProjectCardProps) => {
  const tasks = project.tasks || [];
  const doneTasks = tasks.filter((t: any) => t.status === 'done').length;
  const totalTasks = tasks.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08, duration: 0.35 }}
      onClick={onClick} className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group">
      <div className="flex items-start justify-between mb-1">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-muted-foreground mb-1">{companyName}</p>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">{project.name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {showArchiveCheckbox && onArchiveToggle && (
            <button
              onClick={(e) => { e.stopPropagation(); onArchiveToggle(); }}
              className={cn(
                "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                isArchived
                  ? 'border-primary bg-primary/20 hover:border-destructive hover:bg-transparent'
                  : 'border-muted-foreground/40 hover:border-primary'
              )}
              title={isArchived ? 'Unarchive this project' : 'Archive this project'}
            >
              <Check className={cn('w-3 h-3', isArchived ? 'text-primary' : 'text-transparent hover:text-primary')} />
            </button>
          )}
          <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full capitalize', statusColors[project.status])}>{project.status}</span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{project.description}</p>

      <div className="flex items-center gap-3 mb-3 text-[10px] text-muted-foreground">
        <span className={cn('font-medium capitalize', priorityColors[project.priority])}>{project.priority}</span>
        <span>·</span>
        <span>{formatDateRange(project.start_date, project.end_date)}</span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-medium text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
            className="h-full rounded-full bg-primary" />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{doneTasks}/{totalTasks} tasks</span>
        </div>
        {onNavigate && (
          <button onClick={(e) => { e.stopPropagation(); onNavigate(); }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-medium hover:bg-primary/20 transition-colors">
            View Tasks <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ProjectCard;

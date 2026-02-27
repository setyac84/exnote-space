import { Project } from '@/types';
import { motion } from 'framer-motion';
import { Calendar, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  planning: 'bg-info/15 text-info',
  ongoing: 'bg-warning/15 text-warning',
  completed: 'bg-success/15 text-success',
  archived: 'bg-muted text-muted-foreground',
};

interface ProjectCardProps {
  project: Project;
  index: number;
  onClick: () => void;
}

const ProjectCard = ({ project, index, onClick }: ProjectCardProps) => {
  const doneTasks = project.tasks.filter(t => t.status === 'done').length;
  const totalTasks = project.tasks.length;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      onClick={onClick}
      className="glass-card rounded-xl p-5 cursor-pointer hover:border-primary/30 transition-all group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
          {project.name}
        </h3>
        <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full capitalize', statusColors[project.status])}>
          {project.status}
        </span>
      </div>

      <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{project.description}</p>

      {/* Progress */}
      <div className="mb-3">
        <div className="flex justify-between items-center mb-1.5">
          <span className="text-[11px] text-muted-foreground">Progress</span>
          <span className="text-[11px] font-medium text-foreground">{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: index * 0.08 + 0.3, duration: 0.6 }}
            className="h-full rounded-full bg-primary"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{doneTasks}/{totalTasks} tasks</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          <span>{new Date(project.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default ProjectCard;

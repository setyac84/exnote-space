import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useTasks, useMembers, useCompanies, useCreateProject, useCreateTask, useUpdateTask, useDeleteTask, useUpdateProfile, useUpdateUserRole } from '@/hooks/useSupabaseData';
import { formatDate } from '@/lib/formatDate';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Users, Plus, Pencil, Trash2, Save, ChevronDown } from 'lucide-react';
import TaskCalendar from '@/components/TaskCalendar';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TaskModal from '@/components/TaskModal';
import ProjectModal from '@/components/ProjectModal';
import { cn } from '@/lib/utils';

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
type UserRole = 'super_admin' | 'admin' | 'member';

const statusLabel: Record<TaskStatus, string> = { todo: 'To Do', doing: 'Doing', review: 'Review', done: 'Done' };
const statusDot: Record<TaskStatus, string> = { todo: 'border-muted-foreground', doing: 'border-info', review: 'border-warning', done: 'border-success bg-success' };
const priorityDot: Record<string, string> = { low: 'bg-muted-foreground', medium: 'bg-info', high: 'bg-warning', urgent: 'bg-destructive' };
const priorityLabel: Record<string, string> = { low: 'text-muted-foreground', medium: 'text-info', high: 'text-warning', urgent: 'text-destructive' };
const priorityBadge: Record<string, string> = { low: 'bg-muted text-muted-foreground', medium: 'bg-info/15 text-info', high: 'bg-warning/15 text-warning', urgent: 'bg-destructive/15 text-destructive' };

const InlineStatusDropdown = ({ value, onChange }: { value: TaskStatus; onChange: (s: TaskStatus) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <span className={cn('w-3 h-3 rounded-full border-2 shrink-0', statusDot[value])} />
        {statusLabel[value]}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 min-w-[120px]">
            {(Object.keys(statusLabel) as TaskStatus[]).map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors', value === s && 'font-medium')}>
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

const Dashboard = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: allProjects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: allMembers = [] } = useMembers();
  const { data: companies = [] } = useCompanies();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  if (!user) return null;

  const divisionProjects = allProjects.filter(p => p.division === activeDivision);
  const divisionTasks = allTasks.filter(t => {
    const project = allProjects.find(p => p.id === t.project_id);
    return project?.division === activeDivision;
  });

  const myTasks = isAdmin ? divisionTasks : divisionTasks.filter(t => t.assignee_id === user.id);
  const todoCount = myTasks.filter(t => t.status === 'todo').length;
  const doingCount = myTasks.filter(t => t.status === 'doing').length;
  const doneCount = myTasks.filter(t => t.status === 'done').length;

  const divisionMembers = allMembers.filter(u => u.division === activeDivision && u.role !== 'super_admin');

  const stats = [
    { label: 'Total Projects', value: divisionProjects.length, icon: FolderKanban, color: 'text-primary', bgColor: 'bg-primary/10', onClick: () => navigate('/projects') },
    { label: 'To Do', value: todoCount, icon: Clock, color: 'text-info', bgColor: 'bg-info/10', onClick: () => navigate('/tasks?status=todo') },
    { label: 'In Progress', value: doingCount, icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10', onClick: () => navigate('/tasks?status=doing') },
    { label: 'Done', value: doneCount, icon: CheckCircle2, color: 'text-success', bgColor: 'bg-success/10', onClick: () => navigate('/tasks?status=done') },
  ];

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  const getProjectCompany = (projectId: string) => {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return { projectName: '-', companyName: '-' };
    const company = companies.find(c => c.id === project.company_id);
    return { projectName: project.name, companyName: company?.name || '-' };
  };

  const highPriorityTasks = myTasks
    .filter(t => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'done')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
    });

  return (
    <div className="max-w-7xl mx-auto px-2 lg:px-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Hello, {user.name.split(' ')[0]} 👋</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'All divisions & projects' : isAdmin ? `Overview of ${activeDivision} division` : 'Summary of tasks assigned to you'}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">Today is {format(new Date(), 'd MMM yyyy')}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreateProject(true)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> New Project
            </button>
            <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        )}
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-5">
        {/* Left column: Stats + Team Members */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {/* Stats 2x2 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map((stat, i) => (
              <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                className="glass-card rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 flex-1">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center', stat.bgColor)}>
                      <stat.icon className={cn('w-4 h-4', stat.color)} />
                    </div>
                    <span className="text-xs text-muted-foreground font-medium leading-tight">{stat.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                </div>
                <button onClick={stat.onClick}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-muted-foreground font-medium border-t border-border hover:bg-secondary/50 hover:text-foreground transition-colors">
                  <span>View all</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </motion.div>
            ))}
          </div>

          {/* Member Management - Admin only */}
          {isAdmin && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Team Members</h2>
                </div>
                <button onClick={() => navigate('/members')} className="text-xs text-primary hover:underline">Manage</button>
              </div>
              <div className="space-y-2">
                {divisionMembers.map(member => {
                  const memberTasks = divisionTasks.filter(t => t.assignee_id === member.id);
                  const memberDone = memberTasks.filter(t => t.status === 'done').length;
                  const memberPending = memberTasks.filter(t => t.status !== 'done').length;
                  return (
                    <div key={member.id} onClick={() => navigate(`/tasks?member=${member.id}`)}
                      className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{member.position || 'No position'}</p>
                        <div className="flex items-center gap-3 text-[11px] mt-0.5">
                          <span className="text-warning font-medium">{memberPending} Pending</span>
                          <span className="text-success font-medium">{memberDone} Done</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>

        {/* Right column: High Priority + Calendar */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {/* High Priority Tasks */}
          {highPriorityTasks.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <h2 className="text-sm font-semibold text-foreground">High Priority Tasks</h2>
                </div>
                <button onClick={() => navigate('/tasks?priority=high,urgent')} className="text-xs text-primary hover:underline">View All</button>
              </div>
              {highPriorityTasks.map(task => {
                const assignee = allMembers.find(u => u.id === task.assignee_id);
                const { projectName, companyName } = getProjectCompany(task.project_id);
                return (
                  <div key={task.id} onClick={() => setSelectedTask(task)}
                    className="p-3 border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors">
                    <p className="text-[10px] text-muted-foreground mb-1">{projectName} · {companyName}</p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{task.title}</span>
                      <span className={cn('text-[10px] font-semibold capitalize px-2 py-0.5 rounded-md', priorityBadge[task.priority])}>{task.priority}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-1">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-muted-foreground">{assignee?.name.split(' ')[0]} · {formatDate(task.due_date)}</span>
                      <InlineStatusDropdown value={task.status as TaskStatus} onChange={(s) => handleStatusChange(task.id, s)} />
                    </div>
                  </div>
                );
              })}
            </motion.div>
          )}

          {/* Task Calendar */}
          <TaskCalendar tasks={myTasks as any} members={allMembers} onTaskClick={setSelectedTask} />
        </div>
      </div>

      <TaskModal
        task={selectedTask}
        division={activeDivision}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onDelete={isAdmin ? (id) => { deleteTaskMutation.mutate(id); setSelectedTask(null); } : undefined}
        readOnly={!isAdmin}
      />

      <TaskModal
        task={null}
        division={activeDivision}
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        mode="create"
        projectId=""
      />

      <ProjectModal
        project={null}
        division={activeDivision}
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        mode="create"
      />
    </div>
  );
};

export default Dashboard;

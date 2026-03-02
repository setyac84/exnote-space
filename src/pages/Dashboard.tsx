import React, { useState as useStateReact, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useTasks, useMembers, useCompanies, useCreateProject, useCreateTask, useUpdateTask, useUpdateProject, useDeleteTask, useUpdateProfile, useUpdateUserRole, useTaskAssignees, useNotes, useSetTaskAssignees } from '@/hooks/useSupabaseData';
import { formatDate, formatDaysLeft, daysLeftColor } from '@/lib/formatDate';
import { format, addDays, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { motion } from 'framer-motion';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Users, Plus, Pencil, Trash2, Save, ChevronDown, StickyNote, Filter, Copy } from 'lucide-react';

const DigitalClock = () => {
  const [time, setTime] = useStateReact(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const hours = format(time, 'HH');
  const minutes = format(time, 'mm');
  const seconds = format(time, 'ss');
  return (
    <div className="flex items-center gap-1 font-mono">
      <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{hours}</span>
      <span className="text-2xl sm:text-3xl font-bold text-primary animate-pulse">:</span>
      <span className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{minutes}</span>
      <span className="text-2xl sm:text-3xl font-bold text-primary animate-pulse">:</span>
      <span className="text-2xl sm:text-3xl font-bold text-primary/60 tracking-tight">{seconds}</span>
    </div>
  );
};
import TaskCalendar from '@/components/TaskCalendar';
import AvatarUpload from '@/components/AvatarUpload';
import ProjectCard from '@/components/ProjectCard';
import RunningProjects from '@/components/RunningProjects';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TaskModal from '@/components/TaskModal';
import ProjectModal from '@/components/ProjectModal';
import { cn } from '@/lib/utils';
import StyledDropdown from '@/components/StyledDropdown';
import { generateTaskCode as generateTaskCodeFn } from '@/lib/taskCode';

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
type UserRole = 'super_admin' | 'admin' | 'member';
type TaskViewTab = 'today' | 'tomorrow' | 'overdue' | 'all';

const statusLabel: Record<TaskStatus, string> = { todo: 'To Do', doing: 'Doing', review: 'Review', done: 'Done' };
const statusDot: Record<TaskStatus, string> = { todo: 'border-muted-foreground', doing: 'border-info', review: 'border-warning', done: 'border-success bg-success' };
const priorityDot: Record<string, string> = { low: 'bg-muted-foreground', medium: 'bg-info', high: 'bg-warning', urgent: 'bg-destructive' };
const priorityLabel: Record<string, string> = { low: 'text-muted-foreground', medium: 'text-info', high: 'text-warning', urgent: 'text-destructive' };
const priorityBadge: Record<string, string> = { low: 'bg-muted text-muted-foreground', medium: 'bg-info/15 text-info', high: 'bg-warning/15 text-warning', urgent: 'bg-destructive/15 text-destructive' };

const statusBadgeStyle: Record<TaskStatus, string> = {
  todo: 'bg-muted text-muted-foreground',
  doing: 'bg-info/15 text-info',
  review: 'bg-warning/15 text-warning',
  done: 'bg-success/15 text-success',
};

const InlineStatusDropdown = ({ value, onChange }: {value: TaskStatus;onChange: (s: TaskStatus) => void;}) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className={cn('inline-flex items-center gap-1.5 text-[10px] font-semibold capitalize px-2.5 py-1 rounded-full transition-colors', statusBadgeStyle[value])}>
        {statusLabel[value]}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open &&
      <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1.5 bg-popover border border-border rounded-2xl shadow-xl z-50 p-2 min-w-[130px] space-y-0.5">
            {(Object.keys(statusLabel) as TaskStatus[]).map((s) =>
          <button key={s} onClick={() => {onChange(s);setOpen(false);}}
          className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm rounded-xl hover:bg-secondary/50 transition-colors', value === s && 'font-medium')}>
                <span className={cn('inline-flex items-center text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full', statusBadgeStyle[s])}>
                  {statusLabel[s]}
                </span>
              </button>
          )}
          </div>
        </>
      }
    </div>);
};

const Dashboard = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: allProjects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: allMembers = [] } = useMembers();
  const { data: companies = [] } = useCompanies();
  const { data: allTaskAssignees = [] } = useTaskAssignees();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();
  const createTaskMutation = useCreateTask();
  const setTaskAssigneesMutation = useSetTaskAssignees();
  const { data: notes = [] } = useNotes();

  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [taskViewTab, setTaskViewTab] = useState<TaskViewTab>('today');
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterAssignee, setFilterAssignee] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  if (!user) return null;

  const divisionProjects = allProjects.filter((p) => p.division_id === activeDivision);
  const divisionTasks = allTasks.filter((t) => {
    const project = allProjects.find((p) => p.id === t.project_id);
    return project?.division_id === activeDivision;
  });

  const myTasks = isAdmin ? divisionTasks : divisionTasks.filter((t) => {
    const taIds = allTaskAssignees.filter(ta => ta.task_id === t.id).map(ta => ta.assignee_id);
    return taIds.includes(user.id) || t.assignee_id === user.id;
  });
  const todoCount = myTasks.filter((t) => t.status === 'todo').length;
  const doingCount = myTasks.filter((t) => t.status === 'doing').length;
  const today = format(new Date(), 'yyyy-MM-dd');
  const overdueCount = myTasks.filter((t) => t.status !== 'done' && t.due_date && t.due_date < today).length;
  const urgentCount = myTasks.filter((t) => t.priority === 'urgent' && t.status !== 'done').length;

  const divisionMembers = allMembers.filter((u) => u.division_id === activeDivision && u.role !== 'super_admin');

  const stats = [
  { label: 'High Priority', value: urgentCount, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', onClick: () => navigate('/tasks?priority=urgent'), viewLabel: 'View tasks' },
  { label: 'To Do', value: todoCount, icon: Clock, color: 'text-info', bgColor: 'bg-info/10', onClick: () => navigate('/tasks?status=todo'), viewLabel: 'View tasks' },
  { label: 'In Progress', value: doingCount, icon: AlertTriangle, color: 'text-warning', bgColor: 'bg-warning/10', onClick: () => navigate('/tasks?status=doing'), viewLabel: 'View tasks' },
  { label: 'Overdue', value: overdueCount, icon: AlertTriangle, color: 'text-destructive', bgColor: 'bg-destructive/10', onClick: () => navigate('/tasks'), viewLabel: 'View tasks' }];

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleDuplicateTask = (task: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const { id, created_at, updated_at, code, ...rest } = task;
    const newCode = generateTaskCodeFn(task.project_id, allProjects, companies, allTasks);
    createTaskMutation.mutate(
      { ...rest, status: 'todo' as any, code: newCode },
      {
        onSuccess: (newTask: any) => {
          const taIds = allTaskAssignees.filter(ta => ta.task_id === task.id).map(ta => ta.assignee_id);
          if (taIds.length > 0 && newTask?.id) {
            setTaskAssigneesMutation.mutate({ taskId: newTask.id, assigneeIds: taIds });
          }
        },
      }
    );
  };

  const getProjectCompany = (projectId: string) => {
    const project = allProjects.find((p) => p.id === projectId);
    if (!project) return { projectName: '-', companyName: '-' };
    const company = companies.find((c) => c.id === project.company_id);
    return { projectName: project.name, companyName: company?.name || '-' };
  };

  // Task view tab filtering
  const todayStr = today;
  const tomorrowStr = format(addDays(new Date(), 1), 'yyyy-MM-dd');

  const getFilteredTasks = () => {
    let filtered = myTasks.filter(t => t.status !== 'done');
    
    if (taskViewTab === 'today') {
      filtered = filtered.filter(t => t.due_date === todayStr);
    } else if (taskViewTab === 'tomorrow') {
      filtered = filtered.filter(t => t.due_date === tomorrowStr);
    } else if (taskViewTab === 'overdue') {
      filtered = filtered.filter(t => t.due_date && t.due_date < todayStr);
    }
    
    if (filterProject !== 'all') {
      filtered = filtered.filter(t => t.project_id === filterProject);
    }
    
    if (filterAssignee !== 'all') {
      filtered = filtered.filter(t => {
        const taIds = allTaskAssignees.filter(ta => ta.task_id === t.id).map(ta => ta.assignee_id);
        return taIds.includes(filterAssignee) || t.assignee_id === filterAssignee;
      });
    }

    if (filterMonth !== 'all') {
      const mStart = startOfMonth(parseISO(`${filterMonth}-01`));
      const mEnd = endOfMonth(mStart);
      filtered = filtered.filter(t => {
        if (t.due_date) {
          const d = parseISO(t.due_date);
          return d >= mStart && d <= mEnd;
        }
        return false;
      });
    }
    
    return filtered.sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    });
  };

  const filteredTasks = getFilteredTasks();

  const tabLabels: Record<TaskViewTab, string> = { today: 'Due Today', tomorrow: 'Due Tomorrow', overdue: 'Overdue', all: 'All Tasks' };
  const emptyMessages: Record<TaskViewTab, { emoji: string; title: string; subtitle: string }> = {
    today: { emoji: '🎉', title: 'All clear for today!', subtitle: 'No tasks due today. Get ahead on tomorrow\'s work.' },
    tomorrow: { emoji: '☀️', title: 'Nothing due tomorrow!', subtitle: 'Tomorrow looks clear. Plan ahead or take a break.' },
    overdue: { emoji: '✅', title: 'No overdue tasks!', subtitle: 'Great job staying on schedule.' },
    all: { emoji: '✅', title: 'All caught up!', subtitle: 'No pending tasks at the moment.' },
  };

  const projectFilterOptions = [
    { value: 'all', label: 'All Projects' },
    ...divisionProjects.map(p => ({ value: p.id, label: p.name }))
  ];

  const assigneeFilterOptions = [
    { value: 'all', label: 'All Assignees' },
    ...divisionMembers.map(m => ({ value: m.id, label: m.name }))
  ];

  // Month filter options from task due_dates
  const monthFilterOptions = (() => {
    const months = new Set<string>();
    myTasks.forEach(t => {
      if (t.due_date) months.add(format(parseISO(t.due_date), 'yyyy-MM'));
      if (t.request_date) months.add(format(parseISO(t.request_date as string), 'yyyy-MM'));
    });
    return [
      { value: 'all', label: 'All Months' },
      ...Array.from(months).sort().reverse().map(m => ({
        value: m,
        label: format(parseISO(`${m}-01`), 'MMMM yyyy'),
      }))
    ];
  })();

  return (
    <div className="max-w-7xl mx-auto px-2 lg:px-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 lg:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <AvatarUpload userId={user.id} currentAvatar={user.avatar} name={user.name} size="md" editable={false} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">Hello, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-muted-foreground mt-2 text-sm">Today is <span className="font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-md">{format(new Date(), 'EEEE, d MMM yyyy')}</span></p>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="glass-card rounded-xl px-4 py-2 flex items-center">
            <DigitalClock />
          </div>
        {isAdmin &&
        <div className="flex items-center gap-2">
            <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-md">
              <Plus className="w-4 h-4" /> New Task
            </button>
            <button onClick={() => setShowCreateProject(true)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        }
        </div>
      </motion.div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 lg:gap-5">
        {/* Left column: Stats + Team Members + Notes */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {/* Stats 2x2 */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {stats.map((stat, i) =>
            <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl overflow-hidden flex flex-col">
                <div className="p-4 flex-1">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className={cn('w-4 h-4', stat.color)} />
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                </div>
                <button onClick={stat.onClick}
              className="flex items-center justify-between w-full px-4 py-2.5 text-xs text-muted-foreground font-medium border-t border-border hover:bg-secondary/50 hover:text-foreground transition-colors">
                  <span>{stat.viewLabel}</span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </button>
              </motion.div>
            )}
          </div>

          {/* Member Management - Admin only */}
          {isAdmin &&
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-sm font-semibold text-foreground">Team Members</h2>
                </div>
                <button onClick={() => navigate('/members')} className="text-xs text-primary hover:underline">Manage</button>
              </div>
              <div className="space-y-2">
                {divisionMembers.map((member) => {
                const memberTasks = divisionTasks.filter((t) => {
                  const taIds = allTaskAssignees.filter(ta => ta.task_id === t.id).map(ta => ta.assignee_id);
                  return taIds.includes(member.id) || t.assignee_id === member.id;
                });
                const memberDone = memberTasks.filter((t) => t.status === 'done').length;
                const memberPending = memberTasks.filter((t) => t.status !== 'done').length;
                return (
                  <div key={member.id} onClick={() => navigate(`/tasks?member=${member.id}`)}
                  className="flex items-center gap-3 py-2.5 px-2 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                        {member.name.split(' ').map((n) => n[0]).join('')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                        <p className="text-[11px] text-muted-foreground truncate">{member.position || 'No position'}</p>
                        <div className="flex items-center gap-3 text-[11px] mt-0.5">
                          <span className="text-warning font-medium">{memberPending} Pending</span>
                          <span className="text-success font-medium">{memberDone} Done</span>
                        </div>
                      </div>
                    </div>);
              })}
              </div>
            </motion.div>
          }

          {/* Notepad Widget */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">My Notes</h2>
              </div>
              <button onClick={() => navigate('/notepad')} className="text-xs text-primary hover:underline">View All</button>
            </div>
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <StickyNote className="w-8 h-8 text-muted-foreground/30 mb-2" />
                <p className="text-xs text-muted-foreground">No notes yet</p>
                <button onClick={() => navigate('/notepad')} className="text-xs text-primary mt-2 hover:underline">Create your first note</button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {notes.slice(0, 4).map(note => (
                  <div key={note.id} onClick={() => navigate('/notepad')}
                    className="p-2.5 rounded-lg hover:bg-secondary/50 transition-colors cursor-pointer">
                    <p className="text-sm font-medium text-foreground truncate">{note.title || 'Untitled'}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{note.content || 'No content'}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(note.updated_at), 'd MMM, HH:mm')}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>

        {/* Right column: Running Projects + Calendar + Task Tabs */}
        <div className="flex flex-col gap-4 lg:gap-5">
          {/* Running Projects */}
          <RunningProjects
            projects={divisionProjects}
            tasks={allTasks}
            companies={companies}
            isAdmin={isAdmin}
            onNavigate={() => navigate('/projects')}
            onViewTasks={(projectId) => navigate(`/tasks?project=${projectId}`)}
          />

          {/* Task Calendar */}
          <TaskCalendar tasks={myTasks as any} members={allMembers} taskAssignees={allTaskAssignees} onTaskClick={setSelectedTask} />

          {/* Task View Tabs */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card rounded-xl p-5">
            {/* Task heading above tabs */}
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">{tabLabels[taskViewTab]}</h2>
            </div>

            {/* Tab bar + filter */}
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div className="flex bg-secondary rounded-lg p-0.5 text-xs">
                {(['today', 'tomorrow', 'overdue', 'all'] as TaskViewTab[]).map(tab => (
                  <button key={tab} onClick={() => setTaskViewTab(tab)}
                    className={cn('px-3 py-1.5 rounded-md transition-colors whitespace-nowrap text-xs', 
                      taskViewTab === tab ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')}>
                    {tab === 'today' ? 'Today' : tab === 'tomorrow' ? 'Tomorrow' : tab === 'overdue' ? 'Overdue' : 'All Tasks'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isAdmin && (
                  <StyledDropdown
                    value={filterAssignee}
                    onChange={(v) => setFilterAssignee(v)}
                    options={assigneeFilterOptions}
                    className="w-[160px]"
                  />
                )}
                <StyledDropdown
                  value={filterProject}
                  onChange={(v) => setFilterProject(v)}
                  options={projectFilterOptions}
                  className="w-[160px]"
                />
                <StyledDropdown
                  value={filterMonth}
                  onChange={(v) => setFilterMonth(v)}
                  options={monthFilterOptions}
                  className="w-[160px]"
                />
              </div>
            </div>

            {/* Task list */}
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <span className="text-4xl mb-2">{emptyMessages[taskViewTab].emoji}</span>
                <p className="text-sm font-semibold text-foreground">{emptyMessages[taskViewTab].title}</p>
                <p className="text-xs text-muted-foreground mt-1">{emptyMessages[taskViewTab].subtitle}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map((task) => {
                  const taskAssigneeIds = allTaskAssignees.filter(ta => ta.task_id === task.id).map(ta => ta.assignee_id);
                  const assignees = taskAssigneeIds.length > 0
                    ? taskAssigneeIds.map(id => allMembers.find(u => u.id === id)).filter(Boolean)
                    : (task.assignee_id ? [allMembers.find(u => u.id === task.assignee_id)].filter(Boolean) : []);
                  const { projectName, companyName } = getProjectCompany(task.project_id);
                  return (
                    <div key={task.id} onClick={() => setSelectedTask(task)} className="border border-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm cursor-pointer transition-all bg-card">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] text-muted-foreground">{projectName} · {companyName}</p>
                        <button
                          onClick={(e) => handleDuplicateTask(task, e)}
                          className="p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          title="Duplicate task"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Code + Due date row */}
                      <div className="flex items-center gap-2 mb-1.5">
                        {(task as any).code && (
                          <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">{(task as any).code}</span>
                        )}
                        {task.due_date && (
                          <span className="text-[10px] text-muted-foreground">{formatDate(task.due_date)}</span>
                        )}
                        {taskViewTab === 'all' && task.due_date && formatDaysLeft(task.due_date) && (
                          <span className={cn('text-[10px] font-medium', daysLeftColor(task.due_date))}>{formatDaysLeft(task.due_date)}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-foreground">{task.title}</span>
                        <span className={cn('text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full', priorityBadge[task.priority])}>{task.priority}</span>
                      </div>
                      {task.description && <p className="text-xs text-muted-foreground mb-3 line-clamp-1">{task.description}</p>}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {assignees.length > 0 && (
                            <div className="flex items-center gap-1.5">
                              <div className="flex -space-x-1.5">
                                {assignees.slice(0, 3).map((a: any) => (
                                  <div key={a.id} className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-semibold text-primary border border-card">
                                    {a.name.split(' ').map((n: string) => n[0]).join('')}
                                  </div>
                                ))}
                              </div>
                              <span className="text-[11px] text-muted-foreground">
                                {assignees.length <= 2 ? assignees.map((a: any) => a.name.split(' ')[0]).join(', ') : `${assignees.length} assignees`}
                              </span>
                            </div>
                          )}
                        </div>
                        <InlineStatusDropdown value={task.status as TaskStatus} onChange={(s) => handleStatusChange(task.id, s)} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      <TaskModal
        task={selectedTask}
        division={activeDivision}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onDelete={isAdmin ? (id) => {deleteTaskMutation.mutate(id);setSelectedTask(null);} : undefined}
        readOnly={!isAdmin} />

      <TaskModal
        task={null}
        division={activeDivision}
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        mode="create"
        projectId="" />

      <ProjectModal
        project={null}
        division={activeDivision as string}
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        mode="create" />
    </div>);
};

export default Dashboard;

import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useTasks, useMembers, useCompanies, useUpdateTask, useDeleteTask, useTaskAssignees } from '@/hooks/useSupabaseData';
import TaskModal from '@/components/TaskModal';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDate, formatDaysLeft, daysLeftColor } from '@/lib/formatDate';
import { useSearchParams } from 'react-router-dom';
import { Plus, ChevronDown, Check } from 'lucide-react';
import FilterDropdown from '@/components/FilterDropdown';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
type TabView = 'all' | 'done' | 'archive';

const priorityDot: Record<string, string> = { low: 'bg-muted-foreground', medium: 'bg-info', high: 'bg-warning', urgent: 'bg-destructive' };
const priorityLabel: Record<string, string> = { low: 'text-muted-foreground', medium: 'text-info', high: 'text-warning', urgent: 'text-destructive' };
const statusLabel: Record<TaskStatus, string> = { todo: 'To Do', doing: 'Doing', review: 'Review', done: 'Done' };
const statusDot: Record<TaskStatus, string> = { todo: 'border-muted-foreground', doing: 'border-info', review: 'border-warning', done: 'border-success bg-success' };

const InlineStatusDropdown = ({ value, onChange, dropUp = false }: { value: TaskStatus; onChange: (s: TaskStatus) => void; dropUp?: boolean }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <span className={cn('w-3 h-3 rounded-full border-2 shrink-0', statusDot[value])} /> {statusLabel[value]} <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className={cn('absolute right-0 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 min-w-[120px]', dropUp ? 'bottom-full mb-1' : 'top-full mt-1')}>
            {(Object.keys(statusLabel) as TaskStatus[]).map(s => (
              <button key={s} onClick={() => { onChange(s); setOpen(false); }}
                className={cn('w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-secondary/50 transition-colors', value === s && 'font-medium')}>
                <span className={cn('w-3 h-3 rounded-full border-2 shrink-0', statusDot[s])} /> {statusLabel[s]}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const ProjectFilterDropdown = ({ projects, value, onChange }: { projects: { id: string; name: string }[]; value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const selected = projects.find(p => p.id === value);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-secondary/50 text-foreground hover:border-primary/40 transition-colors">
        <span>{selected?.name || 'Filter by project'}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 min-w-[180px] max-h-[260px] overflow-y-auto">
            <button onClick={() => { onChange(''); setOpen(false); }}
              className={cn('w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors', !value && 'font-medium text-primary')}>
              All Projects
            </button>
            {projects.map(p => (
              <button key={p.id} onClick={() => { onChange(p.id); setOpen(false); }}
                className={cn('w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors', value === p.id && 'font-medium text-primary')}>
                {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const TaskListPage = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode] = useState<'card'>('card');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const hasFilters = searchParams.has('status') || searchParams.has('member') || searchParams.has('priority');
  const [activeTab, setActiveTab] = useState<TabView>(hasFilters ? 'all' : 'all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const { data: allProjects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: allMembers = [] } = useMembers();
  const { data: companies = [] } = useCompanies();
  const { data: allTaskAssignees = [] } = useTaskAssignees();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const statusFilter = searchParams.get('status') as TaskStatus | null;
  const memberFilter = searchParams.get('member');
  const priorityFilter = searchParams.get('priority');
  const projectFilter = searchParams.get('project') || '';
  const assigneeFilter = searchParams.get('assignee') || '';

  const handleAssigneeFilterChange = (assigneeId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (assigneeId) {
      newParams.set('assignee', assigneeId);
    } else {
      newParams.delete('assignee');
    }
    setSearchParams(newParams);
  };

  const handleProjectFilterChange = (projectId: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (projectId) {
      newParams.set('project', projectId);
    } else {
      newParams.delete('project');
    }
    setSearchParams(newParams);
  };

  const divisionProjects = useMemo(() => {
    return allProjects.filter(p => p.division_id === activeDivision);
  }, [allProjects, activeDivision]);

  const divisionMembers = useMemo(() => {
    return allMembers.filter(m => m.division_id === activeDivision && m.role !== 'super_admin');
  }, [allMembers, activeDivision]);

  // Company filter options
  const companyOptions = useMemo(() => {
    const ids = new Set(divisionProjects.map(p => p.company_id));
    return companies.filter(c => ids.has(c.id)).map(c => ({ value: c.id, label: c.name }));
  }, [divisionProjects, companies]);

  // Month filter options from task due_dates
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    allTasks.forEach(t => {
      const project = allProjects.find(p => p.id === t.project_id);
      if (project?.division_id !== activeDivision) return;
      if (t.due_date) months.add(format(parseISO(t.due_date), 'yyyy-MM'));
      if (t.request_date) months.add(format(parseISO(t.request_date), 'yyyy-MM'));
    });
    return Array.from(months).sort().reverse().map(m => ({
      value: m,
      label: format(parseISO(`${m}-01`), 'MMMM yyyy'),
    }));
  }, [allTasks, allProjects, activeDivision]);

  const filteredTasks = useMemo(() => {
    if (!user) return [];
    let filtered = allTasks.filter(t => {
      const project = allProjects.find(p => p.id === t.project_id);
      return project?.division_id === activeDivision;
    });
    if (!isAdmin) {
      filtered = filtered.filter(t => {
        const taskAssigneeIds = allTaskAssignees.filter(ta => ta.task_id === t.id).map(ta => ta.assignee_id);
        return taskAssigneeIds.includes(user.id) || t.assignee_id === user.id;
      });
    }
    if (memberFilter) {
      filtered = filtered.filter(t => {
        const taskAssigneeIds = allTaskAssignees.filter(ta => ta.task_id === t.id).map(ta => ta.assignee_id);
        return taskAssigneeIds.includes(memberFilter) || t.assignee_id === memberFilter;
      });
    }
    if (priorityFilter) {
      const priorities = priorityFilter.split(',');
      filtered = filtered.filter(t => priorities.includes(t.priority));
    }
    if (projectFilter) filtered = filtered.filter(t => t.project_id === projectFilter);
    if (assigneeFilter) {
      filtered = filtered.filter(t => {
        const taIds = allTaskAssignees.filter(ta => ta.task_id === t.id).map(ta => ta.assignee_id);
        return taIds.includes(assigneeFilter) || t.assignee_id === assigneeFilter;
      });
    }

    // Company filter
    if (companyFilter) {
      filtered = filtered.filter(t => {
        const project = allProjects.find(p => p.id === t.project_id);
        return project?.company_id === companyFilter;
      });
    }

    // Month filter - task due_date falls within selected month
    if (monthFilter) {
      const mStart = startOfMonth(parseISO(`${monthFilter}-01`));
      const mEnd = endOfMonth(mStart);
      filtered = filtered.filter(t => {
        if (t.due_date) {
          const d = parseISO(t.due_date);
          return d >= mStart && d <= mEnd;
        }
        return false;
      });
    }

    // Status filter from URL params (e.g. ?status=todo)
    if (statusFilter) {
      filtered = filtered.filter(t => t.status === statusFilter);
    }

    // Tab filtering - only apply when no URL status filter
    if (!statusFilter) {
      if (activeTab === 'all') {
        filtered = filtered.filter(t => t.status !== 'done' && !(t as any).archived);
      } else if (activeTab === 'done') {
        filtered = filtered.filter(t => t.status === 'done' && !(t as any).archived);
      } else if (activeTab === 'archive') {
        filtered = filtered.filter(t => (t as any).archived === true);
      }
    } else {
      // When status filter is active, still exclude archived
      filtered = filtered.filter(t => !(t as any).archived);
    }

    const statusOrder: Record<string, number> = { todo: 0, doing: 1, review: 2, done: 3 };
    filtered.sort((a, b) => {
      const da = a.due_date ? new Date(a.due_date).getTime() : Infinity;
      const db = b.due_date ? new Date(b.due_date).getTime() : Infinity;
      if (da !== db) return da - db;
      return (statusOrder[a.status] ?? 4) - (statusOrder[b.status] ?? 4);
    });
    return filtered;
  }, [allTasks, allProjects, activeDivision, isAdmin, user, memberFilter, priorityFilter, statusFilter, projectFilter, assigneeFilter, activeTab, allTaskAssignees, companyFilter, monthFilter]);

const AssigneeFilterDropdown = ({ members, value, onChange }: { members: { id: string; name: string }[]; value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const selected = members.find(m => m.id === value);
  return (
    <div className="relative" onClick={e => e.stopPropagation()}>
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm rounded-lg border border-border bg-secondary/50 text-foreground hover:border-primary/40 transition-colors">
        <span>{selected?.name || 'Filter by assignee'}</span>
        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 bg-popover border border-border rounded-xl shadow-lg z-50 py-1 min-w-[180px] max-h-[260px] overflow-y-auto">
            <button onClick={() => { onChange(''); setOpen(false); }}
              className={cn('w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors', !value && 'font-medium text-primary')}>
              All Assignees
            </button>
            {members.map(m => (
              <button key={m.id} onClick={() => { onChange(m.id); setOpen(false); }}
                className={cn('w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors', value === m.id && 'font-medium text-primary')}>
                {m.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};


  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    updateTaskMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleArchiveTask = (taskId: string) => {
    updateTaskMutation.mutate({ id: taskId, archived: true } as any);
  };

  const getProjectCompany = (projectId: string) => {
    const project = allProjects.find(p => p.id === projectId);
    if (!project) return { projectName: '-', companyName: '-' };
    const company = companies.find(c => c.id === project.company_id);
    return { projectName: project.name, companyName: company?.name || '-' };
  };

  const tabCounts = useMemo(() => {
    let base = allTasks.filter(t => {
      const project = allProjects.find(p => p.id === t.project_id);
      return project?.division_id === activeDivision;
    });
    if (!isAdmin && user) {
      base = base.filter(t => {
        const taIds = allTaskAssignees.filter(ta => ta.task_id === t.id).map(ta => ta.assignee_id);
        return taIds.includes(user.id) || t.assignee_id === user.id;
      });
    }
    if (projectFilter) base = base.filter(t => t.project_id === projectFilter);
    return {
      all: base.filter(t => t.status !== 'done' && !(t as any).archived).length,
      done: base.filter(t => t.status === 'done' && !(t as any).archived).length,
      archive: base.filter(t => (t as any).archived === true).length,
    };
  }, [allTasks, allProjects, activeDivision, isAdmin, user, projectFilter]);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-2 lg:px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            {(() => {
              const parts: string[] = [];
              if (statusFilter) parts.push(statusLabel[statusFilter] || statusFilter);
              if (memberFilter) {
                const member = allMembers.find(m => m.id === memberFilter);
                if (member) parts.push(member.name.split(' ')[0]);
              }
              if (priorityFilter) parts.push(priorityFilter.charAt(0).toUpperCase() + priorityFilter.slice(1));
              return parts.length > 0 ? `${parts.join(' · ')} - Tasks` : 'All Tasks';
            })()}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{filteredTasks.length} tasks found</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => setShowCreateModal(true)} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Add Task
            </button>
          )}
        </div>
      </motion.div>

      {/* Tabs & Project Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          {([
            { key: 'all', label: 'All Tasks', count: tabCounts.all },
            { key: 'done', label: 'Completed', count: tabCounts.done },
            { key: 'archive', label: 'Archived', count: tabCounts.archive },
          ] as { key: TabView; label: string; count: number }[]).map(tab => (
            <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchParams({}); }}
              className={cn(
                'px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors border',
                !hasFilters && activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:border-primary/30'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {isAdmin && (
            <AssigneeFilterDropdown
              members={divisionMembers}
              value={assigneeFilter}
              onChange={handleAssigneeFilterChange}
            />
          )}
          <ProjectFilterDropdown
            projects={divisionProjects}
            value={projectFilter}
            onChange={handleProjectFilterChange}
          />
          <FilterDropdown
            options={companyOptions}
            value={companyFilter}
            onChange={setCompanyFilter}
            placeholder="Filter by company"
            allLabel="All Companies"
          />
          <FilterDropdown
            options={monthOptions}
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder="Filter by month"
            allLabel="All Months"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTasks.map((task, i) => {
            const taskAssigneeIds = allTaskAssignees.filter(ta => ta.task_id === task.id).map(ta => ta.assignee_id);
            const assignees = taskAssigneeIds.length > 0
              ? taskAssigneeIds.map(id => allMembers.find(u => u.id === id)).filter(Boolean)
              : (task.assignee_id ? [allMembers.find(u => u.id === task.assignee_id)].filter(Boolean) : []);
            const { projectName, companyName } = getProjectCompany(task.project_id);
            return (
              <motion.div key={task.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setSelectedTask(task)} className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all overflow-visible relative">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[10px] text-muted-foreground">{projectName} · {companyName}</p>
                  <div className="flex items-center gap-1.5">
                    <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[task.priority])} />
                    <span className={cn('text-[10px] font-medium capitalize', priorityLabel[task.priority])}>{task.priority}</span>
                  </div>
                </div>
                {(task as any).code && (
                  <span className="text-[10px] font-mono font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded inline-block mb-1">{(task as any).code}</span>
                )}
                <h3 className="text-sm font-medium text-foreground mb-1">{task.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{task.description}</p>
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <span className="text-[10px] text-muted-foreground">{formatDate(task.due_date)}</span>
                  <InlineStatusDropdown value={task.status as TaskStatus} onChange={(s) => handleStatusChange(task.id, s)} />
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <div className="flex -space-x-1.5">
                        {assignees.slice(0, 3).map((a: any) => (
                          <div key={a.id} className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary border border-card">
                            {a.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        ))}
                      </div>
                      <span>{assignees.length > 0 ? (assignees.length <= 2 ? assignees.map((a: any) => a.name.split(' ')[0]).join(', ') : `${assignees.length} assignees`) : 'Unassigned'}</span>
                    </div>
                    {task.due_date && formatDaysLeft(task.due_date) && (
                      <span className={cn('font-medium', daysLeftColor(task.due_date))}>{formatDaysLeft(task.due_date)}</span>
                    )}
                  </div>
                  {(activeTab === 'done' || activeTab === 'archive') && isAdmin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeTab === 'archive') {
                          updateTaskMutation.mutate({ id: task.id, archived: false } as any);
                        } else {
                          handleArchiveTask(task.id);
                        }
                      }}
                      className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                        activeTab === 'archive'
                          ? 'border-primary bg-primary/20 hover:border-destructive hover:bg-transparent'
                          : 'border-muted-foreground/40 hover:border-primary'
                      )}
                      title={activeTab === 'archive' ? 'Unarchive this task' : 'Archive this task'}
                    >
                      <Check className={cn('w-3 h-3', activeTab === 'archive' ? 'text-primary' : 'text-transparent hover:text-primary')} />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
          {filteredTasks.length === 0 && <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-12 text-muted-foreground text-sm">No tasks found.</div>}
        </div>

      <TaskModal task={selectedTask} division={activeDivision} isOpen={!!selectedTask} onClose={() => setSelectedTask(null)}
        onDelete={isAdmin ? (id) => { deleteTaskMutation.mutate(id); setSelectedTask(null); } : undefined} readOnly={!isAdmin} />

      <TaskModal task={null} division={activeDivision} isOpen={showCreateModal} onClose={() => setShowCreateModal(false)}
        mode="create" projectId={projectFilter || ''} />
    </div>
  );
};

export default TaskListPage;

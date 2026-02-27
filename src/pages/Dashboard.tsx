import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/formatDate';
import { mockProjects, mockTasks, mockUsers, mockCompanies } from '@/data/mock';
import { Task, User as UserType, UserRole } from '@/types';
import { motion } from 'framer-motion';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Users, Plus, Pencil, Trash2, Save, X, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TaskModal from '@/components/TaskModal';
import ProjectModal from '@/components/ProjectModal';
import { Project, TaskStatus } from '@/types';
import { cn } from '@/lib/utils';

const statusLabel: Record<TaskStatus, string> = {
  todo: 'To Do',
  doing: 'Doing',
  review: 'Review',
  done: 'Done',
};

const statusDot: Record<TaskStatus, string> = {
  todo: 'border-muted-foreground',
  doing: 'border-info',
  review: 'border-warning',
  done: 'border-success bg-success',
};

const priorityDot: Record<string, string> = {
  low: 'bg-muted-foreground',
  medium: 'bg-info',
  high: 'bg-warning',
  urgent: 'bg-destructive',
};

const priorityLabel: Record<string, string> = {
  low: 'text-muted-foreground',
  medium: 'text-info',
  high: 'text-warning',
  urgent: 'text-destructive',
};

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

const roleOptions: UserRole[] = ['super_admin', 'admin', 'member'];

const Dashboard = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [projects, setProjects] = useState(mockProjects);
  const [members, setMembers] = useState(mockUsers);
  const [editingMember, setEditingMember] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState<Partial<UserType>>({});
  const [showAddMember, setShowAddMember] = useState(false);
  const [showDeleteMember, setShowDeleteMember] = useState<string | null>(null);

  if (!user) return null;

  const divisionProjects = mockProjects.filter(p => p.division === activeDivision);
  const divisionTasks = tasks.filter(t => {
    const project = mockProjects.find(p => p.id === t.project_id);
    return project?.division === activeDivision;
  });

  const myTasks = isAdmin ? divisionTasks : divisionTasks.filter(t => t.assignee_id === user.id);
  const todoCount = myTasks.filter(t => t.status === 'todo').length;
  const doingCount = myTasks.filter(t => t.status === 'doing').length;
  const doneCount = myTasks.filter(t => t.status === 'done').length;

  const divisionMembers = members.filter(u => u.division === activeDivision && u.role !== 'super_admin');

  const stats = [
    { label: 'Total Projects', value: divisionProjects.length, icon: FolderKanban, color: 'text-primary', onClick: () => navigate('/projects') },
    { label: 'To Do', value: todoCount, icon: Clock, color: 'text-info', onClick: () => navigate('/tasks?status=todo') },
    { label: 'In Progress', value: doingCount, icon: AlertTriangle, color: 'text-warning', onClick: () => navigate('/tasks?status=doing') },
    { label: 'Done', value: doneCount, icon: CheckCircle2, color: 'text-success', onClick: () => navigate('/tasks?status=done') },
  ];

  const handleUpdateTask = (updated: Task) => {
    setTasks(prev => {
      const exists = prev.find(t => t.id === updated.id);
      if (exists) return prev.map(t => t.id === updated.id ? updated : t);
      return [...prev, updated];
    });
    setSelectedTask(null);
  };

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setSelectedTask(null);
  };

  const getProjectCompany = (projectId: string) => {
    const project = mockProjects.find(p => p.id === projectId);
    if (!project) return { projectName: '-', companyName: '-' };
    const company = mockCompanies.find(c => c.id === project.company_id);
    return { projectName: project.name, companyName: company?.name || '-' };
  };

  // Member CRUD
  const handleSaveMember = () => {
    if (!memberForm.name?.trim() || !memberForm.email?.trim()) return;
    if (editingMember) {
      setMembers(prev => prev.map(m => m.id === editingMember ? { ...m, ...memberForm } as UserType : m));
    } else {
      const newMember: UserType = {
        id: `u${Date.now()}`,
        name: memberForm.name || '',
        email: memberForm.email || '',
        role: (memberForm.role as UserRole) || 'member',
        division: (memberForm.division as any) || activeDivision,
        company_id: 'c1',
      };
      setMembers(prev => [...prev, newMember]);
    }
    setEditingMember(null);
    setMemberForm({});
    setShowAddMember(false);
  };

  const handleDeleteMember = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setShowDeleteMember(null);
  };

  const highPriorityTasks = myTasks
    .filter(t => t.priority === 'urgent' || t.priority === 'high')
    .sort((a, b) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
    });

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hello, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'Semua divisi & project' : isAdmin ? `Ringkasan progress divisi ${activeDivision}` : 'Ringkasan task yang di-assign ke Anda'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowCreateProject(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> New Project
            </button>
            <button onClick={() => setShowCreateTask(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        )}
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            onClick={stat.onClick} className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Member Management - Admin only */}
      {isAdmin && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Member Management</h2>
            </div>
            <button onClick={() => { setShowAddMember(true); setMemberForm({ role: 'member', division: activeDivision }); }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus className="w-3 h-3" /> Tambah
            </button>
          </div>

          {/* Add Member Form */}
          {showAddMember && (
            <div className="border border-border rounded-lg p-4 mb-4 space-y-3">
              <div className="grid grid-cols-4 gap-3">
                <input value={memberForm.name || ''} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
                  className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="Nama" />
                <input value={memberForm.email || ''} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))}
                  className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground" placeholder="Email" />
                <select value={memberForm.role || 'member'} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value as UserRole }))}
                  className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  {roleOptions.filter(r => !isSuperAdmin ? r !== 'super_admin' : true).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select value={memberForm.division || activeDivision} onChange={e => setMemberForm(f => ({ ...f, division: e.target.value as any }))}
                  className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground">
                  <option value="creative">Creative</option>
                  <option value="developer">Developer</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveMember} className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground">
                  <Save className="w-3.5 h-3.5 inline mr-1" />Save
                </button>
                <button onClick={() => { setShowAddMember(false); setMemberForm({}); }} className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground">Batal</button>
              </div>
            </div>
          )}

          <div className="space-y-2">
            {divisionMembers.map(member => {
              const memberTasks = divisionTasks.filter(t => t.assignee_id === member.id);
              const memberDone = memberTasks.filter(t => t.status === 'done').length;
              const memberPending = memberTasks.filter(t => t.status !== 'done').length;
              const isEditing = editingMember === member.id;

              if (isEditing) {
                return (
                  <div key={member.id} className="border border-border rounded-lg p-3 space-y-2">
                    <div className="grid grid-cols-4 gap-2">
                      <input value={memberForm.name || ''} onChange={e => setMemberForm(f => ({ ...f, name: e.target.value }))}
                        className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground" />
                      <input value={memberForm.email || ''} onChange={e => setMemberForm(f => ({ ...f, email: e.target.value }))}
                        className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground" />
                      <select value={memberForm.role || 'member'} onChange={e => setMemberForm(f => ({ ...f, role: e.target.value as UserRole }))}
                        className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground">
                        {roleOptions.filter(r => !isSuperAdmin ? r !== 'super_admin' : true).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                      <select value={memberForm.division || member.division} onChange={e => setMemberForm(f => ({ ...f, division: e.target.value as any }))}
                        className="bg-secondary/50 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground">
                        <option value="creative">Creative</option>
                        <option value="developer">Developer</option>
                      </select>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={handleSaveMember} className="px-3 py-1 text-xs rounded-lg bg-primary text-primary-foreground">Save</button>
                      <button onClick={() => { setEditingMember(null); setMemberForm({}); }} className="px-3 py-1 text-xs rounded-lg bg-secondary text-secondary-foreground">Batal</button>
                    </div>
                  </div>
                );
              }

              return (
                <div key={member.id} className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-secondary/50 transition-colors">
                  <div className="flex items-center gap-3 cursor-pointer flex-1" onClick={() => navigate(`/tasks?member=${member.id}`)}>
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">{member.position || 'No position'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-warning">{memberPending} Pending</span>
                    <span className="text-success">{memberDone} Done</span>
                    <button onClick={() => { setEditingMember(member.id); setMemberForm({ ...member }); }}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {showDeleteMember === member.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDeleteMember(member.id)} className="px-2 py-1 text-[10px] rounded bg-destructive text-destructive-foreground">Ya</button>
                        <button onClick={() => setShowDeleteMember(null)} className="px-2 py-1 text-[10px] rounded bg-secondary text-secondary-foreground">Tidak</button>
                      </div>
                    ) : (
                      <button onClick={() => setShowDeleteMember(member.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* High Priority Tasks - Same view as Tasks page */}
      {highPriorityTasks.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-destructive" />
              <h2 className="text-sm font-semibold text-foreground">Task Prioritas Tinggi</h2>
            </div>
            <button onClick={() => navigate('/tasks?priority=high,urgent')} className="text-xs text-primary hover:underline">Lihat Semua</button>
          </div>
          {/* Table header matching tasks page */}
          <div className="grid grid-cols-[140px_1fr_1.5fr_90px_90px_110px_110px] gap-2 px-4 py-2.5 text-[11px] font-medium text-muted-foreground uppercase tracking-wide border-b border-border">
            <span>Project · Company</span>
            <span>Task</span>
            <span>Description</span>
            <span>Priority</span>
            <span>Due Date</span>
            <span>Status</span>
            <span>Assignee</span>
          </div>
          {highPriorityTasks.map(task => {
            const assignee = mockUsers.find(u => u.id === task.assignee_id);
            const { projectName, companyName } = getProjectCompany(task.project_id);
            return (
              <div key={task.id} onClick={() => setSelectedTask(task)}
                className="grid grid-cols-[140px_1fr_1.5fr_90px_90px_110px_110px] gap-2 px-4 py-3 border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors items-center">
                <span className="text-[10px] text-muted-foreground">{projectName} · {companyName}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn('w-2 h-2 rounded-full shrink-0', priorityDot[task.priority])} />
                  <span className="text-sm text-foreground font-medium">{task.title}</span>
                </div>
                <span className="text-xs text-muted-foreground line-clamp-2">{task.description}</span>
                <span className={cn('text-xs capitalize', priorityLabel[task.priority])}>{task.priority}</span>
                <span className="text-xs text-muted-foreground">{formatDate(task.due_date)}</span>
                <InlineStatusDropdown value={task.status} onChange={(s) => handleStatusChange(task.id, s)} />
                <span className="text-xs text-muted-foreground">{assignee?.name.split(' ')[0]}</span>
              </div>
            );
          })}
        </motion.div>
      )}

      <TaskModal
        task={selectedTask}
        division={activeDivision}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={isAdmin ? handleDeleteTask : undefined}
        readOnly={!isAdmin}
      />

      <TaskModal
        task={null}
        division={activeDivision}
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onUpdate={(t: Task) => { setTasks(prev => [...prev, t]); setShowCreateTask(false); }}
        mode="create"
        projectId=""
      />

      <ProjectModal
        project={null}
        division={activeDivision}
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSave={(data: any) => {
          const newProject: Project = { ...data, id: `p${Date.now()}`, created_at: new Date().toISOString().split('T')[0], tasks: [] };
          setProjects(prev => [...prev, newProject]);
        }}
        mode="create"
      />
    </div>
  );
};

export default Dashboard;

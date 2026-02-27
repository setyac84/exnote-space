import { useAuth } from '@/contexts/AuthContext';
import { mockProjects, mockTasks, mockUsers } from '@/data/mock';
import { Task } from '@/types';
import { motion } from 'framer-motion';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Users, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import TaskModal from '@/components/TaskModal';
import ProjectModal from '@/components/ProjectModal';
import { Project } from '@/types';

const Dashboard = () => {
  const { user, activeDivision } = useAuth();
  const navigate = useNavigate();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [tasks, setTasks] = useState(mockTasks);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [projects, setProjects] = useState(mockProjects);

  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const divisionProjects = mockProjects.filter(p => p.division === activeDivision);
  const divisionTasks = tasks.filter(t => {
    const project = mockProjects.find(p => p.id === t.project_id);
    return project?.division === activeDivision;
  });

  const myTasks = isAdmin ? divisionTasks : divisionTasks.filter(t => t.assignee_id === user.id);
  const todoCount = myTasks.filter(t => t.status === 'todo').length;
  const doingCount = myTasks.filter(t => t.status === 'doing').length;
  const doneCount = myTasks.filter(t => t.status === 'done').length;
  const urgentCount = myTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').length;

  const divisionMembers = mockUsers.filter(u => u.division === activeDivision);

  const stats = [
    { label: 'Total Projects', value: divisionProjects.length, icon: FolderKanban, color: 'text-primary', onClick: () => navigate('/projects') },
    { label: 'To Do', value: todoCount, icon: Clock, color: 'text-info', onClick: () => navigate('/tasks?status=todo') },
    { label: 'In Progress', value: doingCount, icon: AlertTriangle, color: 'text-warning', onClick: () => navigate('/tasks?status=doing') },
    { label: 'Done', value: doneCount, icon: CheckCircle2, color: 'text-success', onClick: () => navigate('/tasks?status=done') },
  ];

  const handleUpdateTask = (updated: Task) => {
    setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    setSelectedTask(updated);
  };

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isAdmin ? `Dashboard ${activeDivision === 'creative' ? 'Creative' : 'Developer'}` : 'My Dashboard'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isAdmin ? `Ringkasan progress divisi ${activeDivision}` : 'Ringkasan task yang di-assign ke Anda'}
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCreateProject(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
            <button
              onClick={() => setShowCreateTask(true)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <Plus className="w-4 h-4" /> New Task
            </button>
          </div>
        )}
      </motion.div>

      {/* Stats - Clickable */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            onClick={stat.onClick}
            className="glass-card rounded-xl p-4 cursor-pointer hover:border-primary/30 transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Member Activity - Admin only, clickable */}
      {isAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card rounded-xl p-5 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold text-foreground">Aktivitas Member</h2>
          </div>
          <div className="space-y-3">
            {divisionMembers.filter(m => m.role === 'member').map(member => {
              const memberTasks = divisionTasks.filter(t => t.assignee_id === member.id);
              const memberDone = memberTasks.filter(t => t.status === 'done').length;
              const memberPending = memberTasks.filter(t => t.status !== 'done').length;

              return (
                <div
                  key={member.id}
                  onClick={() => navigate(`/tasks?member=${member.id}`)}
                  className="flex items-center justify-between py-2 px-2 rounded-lg cursor-pointer hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-semibold text-primary">
                      {member.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">{memberTasks.length} tasks total</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-warning">{memberPending} Pending</span>
                    <span className="text-success">{memberDone} Done</span>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Urgent Tasks - Clickable */}
      {urgentCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h2 className="text-sm font-semibold text-foreground">Task Prioritas Tinggi</h2>
          </div>
          <div className="space-y-2">
            {myTasks.filter(t => t.priority === 'urgent' || t.priority === 'high').map(task => {
              const assignee = mockUsers.find(u => u.id === task.assignee_id);
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary/80 transition-colors"
                >
                  <div>
                    <p className="text-sm text-foreground">{task.title}</p>
                    <p className="text-[11px] text-muted-foreground">{assignee?.name} · {task.due_date}</p>
                  </div>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${task.priority === 'urgent' ? 'bg-destructive/15 text-destructive' : 'bg-warning/15 text-warning'}`}>
                    {task.priority}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}

      <TaskModal
        task={selectedTask}
        division={activeDivision}
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        readOnly={!isAdmin}
      />

      {/* Create Task Modal */}
      <TaskModal
        task={null}
        division={activeDivision}
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        onUpdate={(t: Task) => {
          setTasks(prev => [...prev, t]);
          setShowCreateTask(false);
        }}
        mode="create"
        projectId=""
      />

      {/* Create Project Modal */}
      <ProjectModal
        project={null}
        division={activeDivision}
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSave={(data: any) => {
          const newProject: Project = {
            ...data,
            id: `p${Date.now()}`,
            created_at: new Date().toISOString().split('T')[0],
            tasks: [],
          };
          setProjects(prev => [...prev, newProject]);
        }}
        mode="create"
      />
    </div>
  );
};

export default Dashboard;

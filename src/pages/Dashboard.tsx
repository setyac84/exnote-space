import { useAuth } from '@/contexts/AuthContext';
import { mockProjects, mockTasks, mockUsers } from '@/data/mock';
import { motion } from 'framer-motion';
import { FolderKanban, CheckCircle2, Clock, AlertTriangle, Users } from 'lucide-react';

const Dashboard = () => {
  const { user, activeDivision } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const divisionProjects = mockProjects.filter(p => p.division === activeDivision);
  const divisionTasks = mockTasks.filter(t => {
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
    { label: 'Total Projects', value: divisionProjects.length, icon: FolderKanban, color: 'text-primary' },
    { label: 'To Do', value: todoCount, icon: Clock, color: 'text-info' },
    { label: 'In Progress', value: doingCount, icon: AlertTriangle, color: 'text-warning' },
    { label: 'Done', value: doneCount, icon: CheckCircle2, color: 'text-success' },
  ];

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {isAdmin ? `Dashboard ${activeDivision === 'creative' ? 'Creative' : 'Developer'}` : 'My Dashboard'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin ? `Ringkasan progress divisi ${activeDivision}` : 'Ringkasan task yang di-assign ke Anda'}
        </p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
              <span className="text-2xl font-bold text-foreground">{stat.value}</span>
            </div>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Member Activity - Admin only */}
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
                <div key={member.id} className="flex items-center justify-between py-2">
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

      {/* Urgent Tasks */}
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
                <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/50">
                  <div>
                    <p className="text-sm text-foreground">{task.title}</p>
                    <p className="text-[11px] text-muted-foreground">{assignee?.name} · {task.end_date}</p>
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
    </div>
  );
};

export default Dashboard;

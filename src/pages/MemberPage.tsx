import { useAuth } from '@/contexts/AuthContext';
import { mockUsers } from '@/data/mock';
import { motion } from 'framer-motion';
import { Users } from 'lucide-react';
import { cn } from '@/lib/utils';

const MemberPage = () => {
  const { user, activeDivision } = useAuth();
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const members = isAdmin
    ? mockUsers.filter(u => u.division === activeDivision)
    : mockUsers.filter(u => u.division === user.division);

  return (
    <div className="max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Member</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Daftar member divisi {activeDivision}
        </p>
      </motion.div>

      <div className="space-y-3">
        {members.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                {member.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={cn(
                'text-[10px] font-medium px-2.5 py-1 rounded-full capitalize',
                member.role === 'admin' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
              )}>
                {member.role}
              </span>
              <span className="text-xs text-muted-foreground capitalize">{member.division}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MemberPage;

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers, useUpdateProfile, useUpdateUserRole } from '@/hooks/useSupabaseData';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

type UserRole = 'super_admin' | 'admin' | 'member';
const roleOptions: UserRole[] = ['super_admin', 'admin', 'member'];

const MemberPage = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const { data: allMembers = [] } = useMembers();
  const updateProfile = useUpdateProfile();
  const updateRole = useUpdateUserRole();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  if (!user) return null;

  const visibleMembers = isAdmin
    ? allMembers.filter(u => u.division === activeDivision && u.role !== 'super_admin')
    : allMembers.filter(u => u.division === user.division);

  const inputCls = 'bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    if (editingId) {
      await updateProfile.mutateAsync({
        id: editingId,
        name: form.name,
        position: form.position,
        division: form.division,
        company_id: form.company_id,
      });
      if (form.role) {
        await updateRole.mutateAsync({ userId: editingId, role: form.role });
      }
      setEditingId(null);
      setForm({});
    }
  };

  const startEdit = (member: any) => {
    setEditingId(member.id);
    setForm({ ...member });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const renderForm = (isInline = false) => (
    <div className={cn('space-y-3', isInline ? 'border border-border rounded-lg p-4' : 'glass-card rounded-xl p-5 mb-4')}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Name</label>
          <input value={form.name || ''} onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))} className={cn(inputCls, 'w-full')} placeholder="Full name" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
          <input value={form.email || ''} disabled className={cn(inputCls, 'w-full opacity-60')} />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Position</label>
          <input value={form.position || ''} onChange={e => setForm((f: any) => ({ ...f, position: e.target.value }))} className={cn(inputCls, 'w-full')} placeholder="e.g. UI/UX Designer" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
          <select value={form.role || 'member'} onChange={e => setForm((f: any) => ({ ...f, role: e.target.value }))} className={cn(inputCls, 'w-full')}>
            {roleOptions.filter(r => isSuperAdmin ? true : r !== 'super_admin').map(r => (
              <option key={r} value={r}>{r === 'super_admin' ? 'Super Admin' : r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Division</label>
          <select value={form.division || activeDivision} onChange={e => setForm((f: any) => ({ ...f, division: e.target.value }))} className={cn(inputCls, 'w-full')}>
            <option value="creative">Creative</option>
            <option value="developer">Developer</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={!form.name?.trim() || updateProfile.isPending}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button onClick={cancelEdit} className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'All members' : `${activeDivision} division members`}
          </p>
        </div>
      </motion.div>

      <div className="space-y-3">
        {visibleMembers.map((member, i) => {
          if (editingId === member.id) {
            return <div key={member.id}>{renderForm(true)}</div>;
          }
          return (
            <motion.div key={member.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold text-primary">
                  {member.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.position || 'No position'}</p>
                  <p className="text-[11px] text-muted-foreground/70">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'text-[10px] font-medium px-2.5 py-1 rounded-full capitalize',
                  member.role === 'admin' || member.role === 'super_admin' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                )}>
                  {member.role === 'super_admin' ? 'Super Admin' : member.role}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{member.division}</span>
                {isAdmin && (
                  <button onClick={() => startEdit(member)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground ml-2">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
        {visibleMembers.length === 0 && <div className="text-center py-20 text-muted-foreground text-sm">No members found.</div>}
      </div>
    </div>
  );
};

export default MemberPage;

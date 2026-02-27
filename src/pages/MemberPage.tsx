import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockUsers } from '@/data/mock';
import { User as UserType, UserRole, Division } from '@/types';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const roleOptions: UserRole[] = ['super_admin', 'admin', 'member'];

const MemberPage = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const [members, setMembers] = useState(mockUsers);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<UserType>>({});
  const [showAdd, setShowAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!user) return null;

  const visibleMembers = isSuperAdmin
    ? members.filter(u => u.role !== 'super_admin')
    : isAdmin
      ? members.filter(u => u.division === activeDivision)
      : members.filter(u => u.division === user.division);

  const inputCls = 'bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

  const handleSave = () => {
    if (!form.name?.trim() || !form.email?.trim()) return;
    if (editingId) {
      setMembers(prev => prev.map(m => m.id === editingId ? { ...m, ...form } as UserType : m));
      setEditingId(null);
    } else {
      const newMember: UserType = {
        id: `u${Date.now()}`,
        name: form.name || '',
        email: form.email || '',
        role: (form.role as UserRole) || 'member',
        division: (form.division as Division) || activeDivision,
        company_id: 'c1',
      };
      setMembers(prev => [...prev, newMember]);
      setShowAdd(false);
    }
    setForm({});
  };

  const handleDelete = (id: string) => {
    setMembers(prev => prev.filter(m => m.id !== id));
    setDeleteConfirm(null);
  };

  const startEdit = (member: UserType) => {
    setEditingId(member.id);
    setForm({ ...member });
    setShowAdd(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm({});
  };

  const renderForm = (isInline = false) => (
    <div className={cn('space-y-3', isInline ? 'border border-border rounded-lg p-4' : 'glass-card rounded-xl p-5 mb-4')}>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Nama</label>
          <input value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={cn(inputCls, 'w-full')} placeholder="Nama lengkap" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
          <input value={form.email || ''} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={cn(inputCls, 'w-full')} placeholder="email@company.com" />
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
          <select value={form.role || 'member'} onChange={e => setForm(f => ({ ...f, role: e.target.value as UserRole }))} className={cn(inputCls, 'w-full')}>
            {roleOptions.filter(r => isSuperAdmin ? true : r !== 'super_admin').map(r => (
              <option key={r} value={r}>{r === 'super_admin' ? 'Super Admin' : r}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Divisi</label>
          <select value={form.division || activeDivision} onChange={e => setForm(f => ({ ...f, division: e.target.value as Division }))} className={cn(inputCls, 'w-full')}>
            <option value="creative">Creative</option>
            <option value="developer">Developer</option>
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={!form.name?.trim() || !form.email?.trim()}
          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
          <Save className="w-3.5 h-3.5" /> Save
        </button>
        <button onClick={() => { cancelEdit(); setShowAdd(false); setForm({}); }}
          className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
          Batal
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Member</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'Semua member' : `Daftar member divisi ${activeDivision}`}
          </p>
        </div>
        {isAdmin && (
          <button onClick={() => { setShowAdd(true); setEditingId(null); setForm({ role: 'member', division: activeDivision }); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Member
          </button>
        )}
      </motion.div>

      {showAdd && renderForm()}

      <div className="space-y-3">
        {visibleMembers.map((member, i) => {
          if (editingId === member.id) {
            return <div key={member.id}>{renderForm(true)}</div>;
          }

          return (
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
                  member.role === 'admin' || member.role === 'super_admin' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                )}>
                  {member.role === 'super_admin' ? 'Super Admin' : member.role}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{member.division}</span>
                {isAdmin && (
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => startEdit(member)}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === member.id ? (
                      <div className="flex items-center gap-1">
                        <button onClick={() => handleDelete(member.id)} className="px-2 py-1 text-[10px] rounded bg-destructive text-destructive-foreground">Hapus</button>
                        <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-[10px] rounded bg-secondary text-secondary-foreground">Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => setDeleteConfirm(member.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MemberPage;

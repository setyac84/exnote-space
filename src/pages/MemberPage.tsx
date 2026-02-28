import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useMembers, useUpdateProfile, useUpdateUserRole, useCreateMember, useDeleteMember, useResetMemberPassword } from '@/hooks/useSupabaseData';
import { motion } from 'framer-motion';
import { Pencil, Trash2, Save, UserPlus, KeyRound, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import StyledDropdown from '@/components/StyledDropdown';

type UserRole = 'super_admin' | 'admin' | 'member';
const roleOptions: UserRole[] = ['super_admin', 'admin', 'member'];

const MemberPage = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const { data: allMembers = [] } = useMembers();
  const updateProfile = useUpdateProfile();
  const updateRole = useUpdateUserRole();
  const createMember = useCreateMember();
  const deleteMember = useDeleteMember();
  const resetPassword = useResetMemberPassword();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState<any>({ division: 'creative', role: 'member' });
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showAddPassword, setShowAddPassword] = useState(false);
  const [showResetPassword, setShowResetPassword] = useState(false);

  if (!user) return null;

  const visibleMembers = isSuperAdmin
    ? allMembers
    : isAdmin
      ? allMembers.filter(u => u.division === activeDivision && u.role !== 'super_admin')
      : allMembers.filter(u => u.division === user.division);

  const inputCls = 'bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

  const handleSave = async () => {
    if (!form.name?.trim()) return;
    if (editingId) {
      try {
        await updateProfile.mutateAsync({
          id: editingId,
          name: form.name,
          position: form.position,
          division: form.division,
        });
        if (form.role && isSuperAdmin) {
          await updateRole.mutateAsync({ userId: editingId, role: form.role });
        }
        toast.success('Member berhasil diupdate');
        setEditingId(null);
        setForm({});
      } catch (err: any) {
        toast.error(err.message || 'Gagal update member');
      }
    }
  };

  const handleAdd = async () => {
    if (!addForm.email?.trim() || !addForm.password?.trim() || !addForm.name?.trim()) {
      toast.error('Email, password, dan nama wajib diisi');
      return;
    }
    try {
      await createMember.mutateAsync(addForm);
      toast.success('Member baru berhasil ditambahkan');
      setShowAddDialog(false);
      setAddForm({ division: 'creative', role: 'member' });
    } catch (err: any) {
      toast.error(err.message || 'Gagal menambahkan member');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteMember.mutateAsync(deleteConfirmId);
      toast.success('Member berhasil dihapus');
      setDeleteConfirmId(null);
    } catch (err: any) {
      toast.error(err.message || 'Gagal menghapus member');
    }
  };

  const handleResetPassword = async () => {
    if (!resetPasswordId || !newPassword.trim()) return;
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter');
      return;
    }
    try {
      await resetPassword.mutateAsync({ userId: resetPasswordId, newPassword });
      toast.success('Password berhasil direset');
      setResetPasswordId(null);
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.message || 'Gagal reset password');
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

  const memberToDelete = allMembers.find(m => m.id === deleteConfirmId);
  const memberToReset = allMembers.find(m => m.id === resetPasswordId);

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
        {isSuperAdmin && (
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
            <StyledDropdown value={form.role || 'member'} onChange={(v) => setForm((f: any) => ({ ...f, role: v }))}
              options={roleOptions.map(r => ({ value: r, label: r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Member' }))} />
          </div>
        )}
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Division</label>
          <StyledDropdown value={form.division || activeDivision} onChange={(v) => setForm((f: any) => ({ ...f, division: v }))}
            options={[{ value: 'creative', label: 'Creative' }, { value: 'developer', label: 'Developer' }]} />
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
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'All members' : `${activeDivision} division members`}
          </p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <UserPlus className="w-4 h-4" /> Add Member
          </button>
        )}
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
                  {member.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.position || 'No position'}</p>
                  <p className="text-[11px] text-muted-foreground/70">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-[10px] font-medium px-2.5 py-1 rounded-full capitalize',
                  member.role === 'admin' || member.role === 'super_admin' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                )}>
                  {member.role === 'super_admin' ? 'Super Admin' : member.role}
                </span>
                <span className="text-xs text-muted-foreground capitalize">{member.division}</span>
                {(isSuperAdmin || (isAdmin && member.role !== 'super_admin')) && (
                  <button onClick={() => startEdit(member)} title="Edit"
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
                {isSuperAdmin && member.id !== user.id && (
                  <>
                    <button onClick={() => setResetPasswordId(member.id)} title="Reset Password"
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <KeyRound className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirmId(member.id)} title="Delete"
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
        {visibleMembers.length === 0 && <div className="text-center py-20 text-muted-foreground text-sm">No members found.</div>}
      </div>

      {/* Add Member Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>Buat akun member baru. Member akan bisa login dengan email dan password yang ditentukan.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Name *</label>
              <input value={addForm.name || ''} onChange={e => setAddForm((f: any) => ({ ...f, name: e.target.value }))} className={cn(inputCls, 'w-full')} placeholder="Full name" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email *</label>
              <input type="email" value={addForm.email || ''} onChange={e => setAddForm((f: any) => ({ ...f, email: e.target.value }))} className={cn(inputCls, 'w-full')} placeholder="email@example.com" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Password *</label>
              <div className="relative">
                <input type={showAddPassword ? 'text' : 'password'} value={addForm.password || ''} onChange={e => setAddForm((f: any) => ({ ...f, password: e.target.value }))} className={cn(inputCls, 'w-full pr-10')} placeholder="Min 6 characters" />
                <button type="button" onClick={() => setShowAddPassword(!showAddPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showAddPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Position</label>
                <input value={addForm.position || ''} onChange={e => setAddForm((f: any) => ({ ...f, position: e.target.value }))} className={cn(inputCls, 'w-full')} placeholder="e.g. Designer" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Role</label>
                <StyledDropdown value={addForm.role || 'member'} onChange={(v) => setAddForm((f: any) => ({ ...f, role: v }))}
                  options={roleOptions.map(r => ({ value: r, label: r === 'super_admin' ? 'Super Admin' : r === 'admin' ? 'Admin' : 'Member' }))} />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Division</label>
                <StyledDropdown value={addForm.division || 'creative'} onChange={(v) => setAddForm((f: any) => ({ ...f, division: v }))}
                  options={[{ value: 'creative', label: 'Creative' }, { value: 'developer', label: 'Developer' }]} />
              </div>
            </div>
            <button onClick={handleAdd} disabled={createMember.isPending}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 mt-2">
              <UserPlus className="w-4 h-4" /> {createMember.isPending ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPasswordId} onOpenChange={() => { setResetPasswordId(null); setNewPassword(''); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Set password baru untuk <strong>{memberToReset?.name}</strong> ({memberToReset?.email})
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Password Baru *</label>
              <div className="relative">
                <input type={showResetPassword ? 'text' : 'password'} value={newPassword} onChange={e => setNewPassword(e.target.value)}
                  className={cn(inputCls, 'w-full pr-10')} placeholder="Min 6 karakter" />
                <button type="button" onClick={() => setShowResetPassword(!showResetPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showResetPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setResetPasswordId(null); setNewPassword(''); }}
                className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                Batal
              </button>
              <button onClick={handleResetPassword} disabled={resetPassword.isPending || newPassword.length < 6}
                className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Member</DialogTitle>
            <DialogDescription>
              Apakah kamu yakin ingin menghapus <strong>{memberToDelete?.name}</strong>? Akun dan semua data terkait akan dihapus permanen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              Batal
            </button>
            <button onClick={handleDelete} disabled={deleteMember.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50">
              {deleteMember.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MemberPage;

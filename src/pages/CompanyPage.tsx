import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany, useMembers, useUserCompanies, useAddUserToCompany, useRemoveUserFromCompany, useDivisions } from '@/hooks/useSupabaseData';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Save, X, Building2, ChevronDown, UserPlus, UserMinus, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AvatarUpload from '@/components/AvatarUpload';
import StyledDropdown from '@/components/StyledDropdown';

const inputCls = 'w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

const CompanyPage = () => {
  const { user, isSuperAdmin, isAdmin } = useAuth();
  const { data: companies = [] } = useCompanies();
  const { data: allMembers = [] } = useMembers();
  const { data: userCompanies = [] } = useUserCompanies();
  const { data: divisions = [] } = useDivisions();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();
  const addUserToCompany = useAddUserToCompany();
  const removeUserFromCompany = useRemoveUserFromCompany();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);
  const [addMemberDialog, setAddMemberDialog] = useState<string | null>(null); // company_id
  const [removeMemberConfirm, setRemoveMemberConfirm] = useState<{ userId: string; companyId: string } | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  if (!user) return null;

  const canManage = isAdmin;

  const getDivisionName = (divisionId: string | null) => {
    if (!divisionId) return '';
    return divisions.find(d => d.id === divisionId)?.name || '';
  };

  const getMembersForCompany = (companyId: string) => {
    const memberEntries = userCompanies.filter(uc => uc.company_id === companyId);
    const memberIds = memberEntries.map(uc => uc.user_id);
    let filtered = allMembers.filter(m => memberIds.includes(m.id));
    
    // Hide owner/super_admin from admin and member roles
    if (!isSuperAdmin && user?.role !== 'owner') {
      const hiddenRoles = ['owner', 'super_admin'];
      filtered = filtered.filter(m => {
        const role = memberEntries.find(uc => uc.user_id === m.id)?.role || 'member';
        return !hiddenRoles.includes(role);
      });
    }
    
    return filtered;
  };

  const getMemberRole = (userId: string, companyId: string) => {
    const uc = userCompanies.find(u => u.user_id === userId && u.company_id === companyId);
    return uc?.role || 'member';
  };

  const getAvailableMembers = (companyId: string) => {
    const existingIds = userCompanies.filter(uc => uc.company_id === companyId).map(uc => uc.user_id);
    return allMembers.filter(m => !existingIds.includes(m.id));
  };

  const handleCreate = async () => {
    if (!form.name.trim()) return;
    await createMutation.mutateAsync({ name: form.name, description: form.description });
    setForm({ name: '', description: '' });
    setShowCreate(false);
  };

  const handleEdit = (company: any) => {
    setEditingId(company.id);
    setForm({ name: company.name, description: company.description || '' });
  };

  const handleSave = async (id: string) => {
    if (!form.name.trim()) return;
    await updateMutation.mutateAsync({ id, name: form.name, description: form.description });
    setEditingId(null);
    setForm({ name: '', description: '' });
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
    setDeleteConfirm(null);
  };

  const handleAddMember = async () => {
    if (!addMemberDialog || !selectedMemberId) return;
    try {
      await addUserToCompany.mutateAsync({ userId: selectedMemberId, companyId: addMemberDialog });
      toast.success('Member added to company successfully');
      setAddMemberDialog(null);
      setSelectedMemberId('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to add member');
    }
  };

  const handleRemoveMember = async () => {
    if (!removeMemberConfirm) return;
    try {
      await removeUserFromCompany.mutateAsync(removeMemberConfirm);
      toast.success('Member removed from company');
      setRemoveMemberConfirm(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const roleLabel = (role: string) => {
    if (role === 'super_admin') return 'Super Admin';
    if (role === 'owner') return 'Owner';
    return role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-2 lg:px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your companies and team assignments</p>
        </div>
        {canManage && (
          <button onClick={() => { setShowCreate(true); setForm({ name: '', description: '' }); }}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Company
          </button>
        )}
      </motion.div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-xl p-5 mb-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-foreground">New Company</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Company name..." />
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Description..." />
              <button onClick={handleCreate} disabled={!form.name.trim() || createMutation.isPending}
                className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                <Save className="w-3.5 h-3.5" /> Save
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {companies.map((company, i) => {
          const members = getMembersForCompany(company.id);
          const isExpanded = expandedCompany === company.id;

          return (
            <motion.div key={company.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl overflow-hidden">
              {/* Company Header */}
              {editingId === company.id ? (
                <div className="p-5 space-y-3">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} autoFocus />
                  <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} placeholder="Description..." />
                  <div className="flex gap-2">
                    <button onClick={() => handleSave(company.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                      <Save className="w-3.5 h-3.5" /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="p-5 flex items-center justify-between">
                  <button onClick={() => setExpandedCompany(isExpanded ? null : company.id)} className="flex items-center gap-3 flex-1 text-left">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-foreground">{company.name}</h3>
                      <p className="text-xs text-muted-foreground">{company.description || 'No description'}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{members.length}</span>
                      <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform ml-1", isExpanded && "rotate-180")} />
                    </div>
                  </button>
                  {canManage && (
                    <div className="flex items-center gap-1 ml-2 shrink-0">
                      <button onClick={() => handleEdit(company)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      {deleteConfirm === company.id ? (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleDelete(company.id)} className="px-2 py-1 text-xs rounded bg-destructive text-destructive-foreground">Yes</button>
                          <button onClick={() => setDeleteConfirm(null)} className="px-2 py-1 text-xs rounded bg-secondary text-secondary-foreground">No</button>
                        </div>
                      ) : (
                        <button onClick={() => setDeleteConfirm(company.id)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Members List (Expandable) */}
              <AnimatePresence>
                {isExpanded && editingId !== company.id && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden">
                    <div className="border-t border-border px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Members ({members.length})</h4>
                        {canManage && (
                          <button onClick={() => { setAddMemberDialog(company.id); setSelectedMemberId(''); }}
                            className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                            <UserPlus className="w-3 h-3" /> Add
                          </button>
                        )}
                      </div>

                      {members.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 text-center">No members in this company</p>
                      ) : (
                        <div className="space-y-2">
                          {members.map(member => {
                            const role = getMemberRole(member.id, company.id);
                            return (
                              <div key={member.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/30 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                  <AvatarUpload userId={member.id} currentAvatar={member.avatar} name={member.name} size="sm" editable={false} />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{member.name}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <span>{member.position || 'No position'}</span>
                                      {getDivisionName(member.division_id) && (
                                        <>
                                          <span className="text-border">•</span>
                                          <span>{getDivisionName(member.division_id)}</span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                  <span className={cn(
                                    'text-[10px] font-medium px-2 py-0.5 rounded-full capitalize',
                                    role === 'owner' || role === 'super_admin' || role === 'admin'
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-secondary text-muted-foreground'
                                  )}>
                                    {roleLabel(role)}
                                  </span>
                                  {canManage && role !== 'owner' && member.id !== user.id && (
                                    <button onClick={() => setRemoveMemberConfirm({ userId: member.id, companyId: company.id })}
                                      title="Remove from company"
                                      className="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        {companies.length === 0 && <div className="text-center py-20 text-muted-foreground text-sm">No companies yet.</div>}
      </div>

      {/* Add Member to Company Dialog */}
      <Dialog open={!!addMemberDialog} onOpenChange={() => setAddMemberDialog(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Member to Company</DialogTitle>
            <DialogDescription>
              Add a member to {companies.find(c => c.id === addMemberDialog)?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {addMemberDialog && getAvailableMembers(addMemberDialog).length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">All members are already in this company</p>
            ) : (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Member</label>
                  <StyledDropdown
                    value={selectedMemberId}
                    onChange={setSelectedMemberId}
                    options={(addMemberDialog ? getAvailableMembers(addMemberDialog) : []).map(m => ({
                      value: m.id,
                      label: `${m.name} (${m.email})`,
                    }))}
                    placeholder="Select member..."
                  />
                </div>
                <button onClick={handleAddMember} disabled={!selectedMemberId || addUserToCompany.isPending}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <UserPlus className="w-4 h-4" /> {addUserToCompany.isPending ? 'Adding...' : 'Add Member'}
                </button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation Dialog */}
      <Dialog open={!!removeMemberConfirm} onOpenChange={() => setRemoveMemberConfirm(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{allMembers.find(m => m.id === removeMemberConfirm?.userId)?.name}</strong> from <strong>{companies.find(c => c.id === removeMemberConfirm?.companyId)?.name}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2 justify-end">
            <button onClick={() => setRemoveMemberConfirm(null)}
              className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
            <button onClick={handleRemoveMember} disabled={removeUserFromCompany.isPending}
              className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50">
              {removeUserFromCompany.isPending ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CompanyPage;

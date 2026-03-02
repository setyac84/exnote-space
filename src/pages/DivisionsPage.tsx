import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  useDivisions, useCreateDivision, useUpdateDivision, useDeleteDivision,
  useMembers, useUpdateProfile,
} from '@/hooks/useSupabaseData';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Save, X, Users, FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import AvatarUpload from '@/components/AvatarUpload';
import StyledDropdown from '@/components/StyledDropdown';

const DivisionsPage = () => {
  const { user, isSuperAdmin } = useAuth();
  const { data: divisions = [] } = useDivisions();
  const { data: members = [] } = useMembers();
  const createDivision = useCreateDivision();
  const updateDivision = useUpdateDivision();
  const deleteDivision = useDeleteDivision();
  const updateProfile = useUpdateProfile();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [assignDialogDivisionId, setAssignDialogDivisionId] = useState<string | null>(null);
  const [selectedMemberId, setSelectedMemberId] = useState('');

  if (!user) return null;

  const getMembersInDivision = (divisionId: string) =>
    members.filter(m => m.division_id === divisionId);

  const unassignedMembers = members.filter(m => !m.division_id);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createDivision.mutateAsync({ name: newName.trim() });
      toast.success('Division created');
      setNewName('');
      setShowAddDialog(false);
    } catch (err: any) {
      toast.error(err.message || 'Failed to create division');
    }
  };

  const handleUpdate = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateDivision.mutateAsync({ id: editingId, name: editName.trim() });
      toast.success('Division updated');
      setEditingId(null);
      setEditName('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update division');
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await deleteDivision.mutateAsync(deleteConfirmId);
      toast.success('Division deleted');
      setDeleteConfirmId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete division');
    }
  };

  const handleAssignMember = async () => {
    if (!assignDialogDivisionId || !selectedMemberId) return;
    try {
      await updateProfile.mutateAsync({ id: selectedMemberId, division_id: assignDialogDivisionId });
      toast.success('Member assigned to division');
      setSelectedMemberId('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign member');
    }
  };

  const handleRemoveFromDivision = async (memberId: string) => {
    try {
      await updateProfile.mutateAsync({ id: memberId, division_id: null });
      toast.success('Member removed from division');
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const divisionToDelete = divisions.find(d => d.id === deleteConfirmId);
  const assignDivision = divisions.find(d => d.id === assignDialogDivisionId);
  const assignableMembersForDivision = members.filter(
    m => m.division_id !== assignDialogDivisionId
  );

  const inputCls = 'bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

  return (
    <div className="max-w-5xl mx-auto px-2 lg:px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Divisions</h1>
          <p className="text-sm text-muted-foreground mt-1">Organize your team into divisions</p>
        </div>
        {isSuperAdmin && (
          <button onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> New Division
          </button>
        )}
      </motion.div>

      <div className="space-y-4">
        {divisions.map((division, i) => {
          const divMembers = getMembersInDivision(division.id);
          const isEditing = editingId === division.id;

          return (
            <motion.div key={division.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="glass-card rounded-xl overflow-hidden">
              {/* Division header */}
              <div className="p-4 flex items-center justify-between border-b border-border/50">
                {isEditing ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className={cn(inputCls, 'flex-1 max-w-xs')} autoFocus
                      onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
                    <button onClick={handleUpdate} disabled={!editName.trim() || updateDivision.isPending}
                      className="p-1.5 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingId(null); setEditName(''); }}
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FolderOpen className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">{division.name}</h3>
                      <p className="text-xs text-muted-foreground">{divMembers.length} member{divMembers.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )}

                {!isEditing && isSuperAdmin && (
                  <div className="flex items-center gap-1">
                    <button onClick={() => setAssignDialogDivisionId(division.id)} title="Assign members"
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Users className="w-4 h-4" />
                    </button>
                    <button onClick={() => { setEditingId(division.id); setEditName(division.name); }} title="Edit"
                      className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteConfirmId(division.id)} title="Delete"
                      className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Members list */}
              {divMembers.length > 0 ? (
                <div className="divide-y divide-border/30">
                  {divMembers.map(member => (
                    <div key={member.id} className="px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <AvatarUpload userId={member.id} currentAvatar={member.avatar} name={member.name} size="sm" editable={false} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{member.name}</p>
                          <p className="text-[11px] text-muted-foreground">{member.position || member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-[10px] font-medium px-2 py-0.5 rounded-full capitalize',
                          member.role === 'owner' || member.role === 'super_admin' ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                        )}>
                          {member.role === 'super_admin' ? 'Super Admin' : member.role}
                        </span>
                        {isSuperAdmin && (
                          <button onClick={() => handleRemoveFromDivision(member.id)} title="Remove from division"
                            className="p-1 rounded-md hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No members assigned</div>
              )}
            </motion.div>
          );
        })}

        {divisions.length === 0 && (
          <div className="text-center py-20 text-muted-foreground text-sm">No divisions yet. Create one to get started.</div>
        )}

        {/* Unassigned members section */}
        {unassignedMembers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Unassigned</h3>
                  <p className="text-xs text-muted-foreground">{unassignedMembers.length} member{unassignedMembers.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>
            <div className="divide-y divide-border/30">
              {unassignedMembers.map(member => (
                <div key={member.id} className="px-4 py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <AvatarUpload userId={member.id} currentAvatar={member.avatar} name={member.name} size="sm" editable={false} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{member.name}</p>
                      <p className="text-[11px] text-muted-foreground">{member.position || member.email}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">No division</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Create Division Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Create Division</DialogTitle>
            <DialogDescription>Add a new division to organize your team</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Division Name</label>
              <input value={newName} onChange={e => setNewName(e.target.value)} className={cn(inputCls, 'w-full')}
                placeholder="e.g. Marketing, Operations" autoFocus
                onKeyDown={e => e.key === 'Enter' && handleCreate()} />
            </div>
            <button onClick={handleCreate} disabled={!newName.trim() || createDivision.isPending}
              className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
              <Plus className="w-4 h-4" /> {createDivision.isPending ? 'Creating...' : 'Create Division'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Members Dialog */}
      <Dialog open={!!assignDialogDivisionId} onOpenChange={() => { setAssignDialogDivisionId(null); setSelectedMemberId(''); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Member</DialogTitle>
            <DialogDescription>
              Add a member to <strong>{assignDivision?.name}</strong> division
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            {assignableMembersForDivision.length > 0 ? (
              <>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Member</label>
                  <StyledDropdown value={selectedMemberId} onChange={setSelectedMemberId}
                    options={assignableMembersForDivision.map(m => ({
                      value: m.id,
                      label: `${m.name} ${m.division_id ? `(${divisions.find(d => d.id === m.division_id)?.name || 'Other'})` : '(Unassigned)'}`,
                    }))} />
                </div>
                <button onClick={handleAssignMember} disabled={!selectedMemberId || updateProfile.isPending}
                  className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                  <Users className="w-4 h-4" /> {updateProfile.isPending ? 'Assigning...' : 'Assign Member'}
                </button>
              </>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">All members are already in this division</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Division</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{divisionToDelete?.name}</strong>?
              Members in this division will become unassigned.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <button onClick={() => setDeleteConfirmId(null)}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
            <button onClick={handleDelete} disabled={deleteDivision.isPending}
              className="flex-1 px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-50">
              {deleteDivision.isPending ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DivisionsPage;

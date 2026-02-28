import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies, useCreateCompany, useUpdateCompany, useDeleteCompany } from '@/hooks/useSupabaseData';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Pencil, Trash2, Save, X, Building2 } from 'lucide-react';

const CompanyPage = () => {
  const { user, isAdmin } = useAuth();
  const { data: companies = [] } = useCompanies();
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();
  const deleteMutation = useDeleteCompany();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  if (!user) return null;

  const inputCls = 'w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';

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

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Companies</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage companies for your projects</p>
        </div>
        {isAdmin && (
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
        {companies.map((company, i) => (
          <motion.div key={company.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-5">
            {editingId === company.id ? (
              <div className="space-y-3">
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={inputCls} />
                <div className="flex gap-2">
                  <button onClick={() => handleSave(company.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                    <Save className="w-3.5 h-3.5" /> Save
                  </button>
                  <button onClick={() => setEditingId(null)} className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">{company.name}</h3>
                    <p className="text-xs text-muted-foreground">{company.description}</p>
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
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
          </motion.div>
        ))}
        {companies.length === 0 && <div className="text-center py-20 text-muted-foreground text-sm">No companies yet.</div>}
      </div>
    </div>
  );
};

export default CompanyPage;

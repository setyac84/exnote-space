import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompanies, useCreateProject, useUpdateProject, useDeleteProject } from '@/hooks/useSupabaseData';
import { X, Pencil, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type ProjectStatus = 'planning' | 'ongoing' | 'completed' | 'archived';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type Division = 'creative' | 'developer';
type ModalMode = 'view' | 'edit' | 'create';

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' }, { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' }, { value: 'archived', label: 'Archived' },
];

const priorityOptions: { value: TaskPriority; label: string; cls: string }[] = [
  { value: 'low', label: 'Low', cls: 'text-muted-foreground' }, { value: 'medium', label: 'Medium', cls: 'text-info' },
  { value: 'high', label: 'High', cls: 'text-warning' }, { value: 'urgent', label: 'Urgent', cls: 'text-destructive' },
];

interface ProjectModalProps {
  project?: any;
  division: Division;
  isOpen: boolean;
  onClose: () => void;
  mode?: ModalMode;
}

const ProjectModal = ({ project, division, isOpen, onClose, mode: initialMode = 'view' }: ProjectModalProps) => {
  const { isAdmin } = useAuth();
  const { data: companies = [] } = useCompanies();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const emptyForm = () => ({
    name: '', description: '', company_id: companies[0]?.id || '',
    status: 'planning' as ProjectStatus, priority: 'medium' as TaskPriority,
    division, start_date: new Date().toISOString().split('T')[0], end_date: '',
  });

  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [form, setForm] = useState(emptyForm());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    setShowDeleteConfirm(false);
    if (initialMode === 'create') {
      setForm(emptyForm());
    } else if (project) {
      setForm({
        name: project.name, description: project.description || '',
        company_id: project.company_id, status: project.status,
        priority: project.priority, division: project.division,
        start_date: project.start_date || '', end_date: project.end_date || '',
      });
    }
  }, [project, initialMode, division, isOpen, companies]);

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (mode === 'create') {
      await createProject.mutateAsync({
        name: form.name, description: form.description, company_id: form.company_id,
        division: form.division, status: form.status, priority: form.priority,
        start_date: form.start_date || undefined, end_date: form.end_date || undefined,
      });
    } else if (project) {
      await updateProject.mutateAsync({
        id: project.id, name: form.name, description: form.description,
        company_id: form.company_id, status: form.status, priority: form.priority,
        start_date: form.start_date || null, end_date: form.end_date || null,
      });
    }
    onClose();
  };

  const handleDelete = async () => {
    if (project) {
      await deleteProject.mutateAsync(project.id);
      onClose();
    }
  };

  const isEditable = mode === 'edit' || mode === 'create';
  const company = companies.find(c => c.id === form.company_id);
  const inputCls = 'w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1.5 block';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 pb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {mode === 'create' ? 'New Project' : mode === 'edit' ? 'Edit Project' : 'Project Details'}
                </h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1"><X className="w-5 h-5" /></button>
              </div>

              <div className="px-6 pb-6 space-y-4">
                <div>
                  <label className={labelCls}>Company</label>
                  {isEditable ? (
                    <select value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))} className={inputCls}>
                      {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  ) : (
                    <p className="text-sm text-foreground">{company?.name}</p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Project Name</label>
                  {isEditable ? (
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className={inputCls} placeholder="Project name..." />
                  ) : (
                    <p className="text-sm text-foreground">{form.name}</p>
                  )}
                </div>

                <div>
                  <label className={labelCls}>Description</label>
                  {isEditable ? (
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className={cn(inputCls, 'min-h-[80px] resize-none')} placeholder="Project description..." />
                  ) : (
                    <p className="text-sm text-foreground">{form.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    {isEditable ? <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
                      : <p className="text-sm text-foreground">{form.start_date}</p>}
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    {isEditable ? <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} />
                      : <p className="text-sm text-foreground">{form.end_date}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Priority</label>
                    {isEditable ? (
                      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))} className={inputCls}>
                        {priorityOptions.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    ) : (
                      <span className={cn('text-sm capitalize', priorityOptions.find(p => p.value === form.priority)?.cls)}>{form.priority}</span>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    {isEditable ? (
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))} className={inputCls}>
                        {statusOptions.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                    ) : (
                      <span className="text-sm capitalize">{form.status}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  {mode === 'view' && isAdmin && (
                    <>
                      <button onClick={() => setMode('edit')} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </>
                  )}
                  {isEditable && (
                    <>
                      <button onClick={handleSave} disabled={!form.name.trim() || createProject.isPending || updateProject.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      {mode === 'edit' && (
                        <button onClick={() => setMode('view')} className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
                      )}
                    </>
                  )}
                </div>

                {showDeleteConfirm && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-foreground mb-3">Are you sure you want to delete this project?</p>
                    <div className="flex gap-2">
                      <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, Delete</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground">Cancel</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProjectModal;

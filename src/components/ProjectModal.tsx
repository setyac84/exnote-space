import { useState, useEffect } from 'react';
import { Project, ProjectStatus, TaskPriority, Division } from '@/types';
import { mockCompanies } from '@/data/mock';
import { X, Pencil, Trash2, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: 'planning', label: 'Planning' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

const priorityOptions: { value: TaskPriority; label: string; cls: string }[] = [
  { value: 'low', label: 'Low', cls: 'text-muted-foreground' },
  { value: 'medium', label: 'Medium', cls: 'text-info' },
  { value: 'high', label: 'High', cls: 'text-warning' },
  { value: 'urgent', label: 'Urgent', cls: 'text-destructive' },
];

type ModalMode = 'view' | 'edit' | 'create';

interface ProjectModalProps {
  project?: Project | null;
  division: Division;
  isOpen: boolean;
  onClose: () => void;
  onSave: (project: Omit<Project, 'id' | 'created_at' | 'tasks'> & { id?: string }) => void;
  onDelete?: (id: string) => void;
  mode?: ModalMode;
}

const emptyForm = (division: Division) => ({
  name: '',
  description: '',
  company_id: mockCompanies[0]?.id || '',
  status: 'planning' as ProjectStatus,
  priority: 'medium' as TaskPriority,
  division,
  start_date: new Date().toISOString().split('T')[0],
  end_date: '',
});

const ProjectModal = ({ project, division, isOpen, onClose, onSave, onDelete, mode: initialMode = 'view' }: ProjectModalProps) => {
  const [mode, setMode] = useState<ModalMode>(initialMode);
  const [form, setForm] = useState(emptyForm(division));
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === 'create') {
      setForm(emptyForm(division));
    } else if (project) {
      setForm({
        name: project.name,
        description: project.description,
        company_id: project.company_id,
        status: project.status,
        priority: project.priority,
        division: project.division,
        start_date: project.start_date,
        end_date: project.end_date,
      });
    }
  }, [project, initialMode, division, isOpen]);

  const handleSave = () => {
    if (!form.name.trim()) return;
    onSave({
      ...form,
      id: project?.id,
    });
    onClose();
  };

  const handleDelete = () => {
    if (project && onDelete) {
      onDelete(project.id);
      onClose();
    }
  };

  const isEditable = mode === 'edit' || mode === 'create';
  const company = mockCompanies.find(c => c.id === form.company_id);

  const inputCls = 'w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1.5 block';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="glass-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <h2 className="text-lg font-semibold text-foreground">
                  {mode === 'create' ? 'Tambah Project' : mode === 'edit' ? 'Edit Project' : 'Detail Project'}
                </h2>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-4">
                {/* Company */}
                <div>
                  <label className={labelCls}>Company</label>
                  {isEditable ? (
                    <select
                      value={form.company_id}
                      onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}
                      className={inputCls}
                    >
                      {mockCompanies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-sm text-foreground">{company?.name}</p>
                  )}
                </div>

                {/* Project Name */}
                <div>
                  <label className={labelCls}>Nama Project</label>
                  {isEditable ? (
                    <input
                      value={form.name}
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      className={inputCls}
                      placeholder="Nama project..."
                    />
                  ) : (
                    <p className="text-sm text-foreground">{form.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Deskripsi</label>
                  {isEditable ? (
                    <textarea
                      value={form.description}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className={cn(inputCls, 'min-h-[80px] resize-none')}
                      placeholder="Deskripsi project..."
                    />
                  ) : (
                    <p className="text-sm text-foreground">{form.description}</p>
                  )}
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Start Date</label>
                    {isEditable ? (
                      <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} className={inputCls} />
                    ) : (
                      <p className="text-sm text-foreground">{form.start_date}</p>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>End Date</label>
                    {isEditable ? (
                      <input type="date" value={form.end_date} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} className={inputCls} />
                    ) : (
                      <p className="text-sm text-foreground">{form.end_date}</p>
                    )}
                  </div>
                </div>

                {/* Priority & Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Priority</label>
                    {isEditable ? (
                      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TaskPriority }))} className={inputCls}>
                        {priorityOptions.map(p => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className={cn('text-sm capitalize', priorityOptions.find(p => p.value === form.priority)?.cls)}>{form.priority}</span>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    {isEditable ? (
                      <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))} className={inputCls}>
                        {statusOptions.map(s => (
                          <option key={s.value} value={s.value}>{s.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-sm capitalize">{form.status}</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  {mode === 'view' && (
                    <>
                      <button
                        onClick={() => setMode('edit')}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      {onDelete && (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Hapus
                        </button>
                      )}
                    </>
                  )}
                  {isEditable && (
                    <>
                      <button
                        onClick={handleSave}
                        disabled={!form.name.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      {mode === 'edit' && (
                        <button
                          onClick={() => setMode('view')}
                          className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                        >
                          Batal
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-foreground mb-3">Yakin ingin menghapus project ini?</p>
                    <div className="flex gap-2">
                      <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Ya, Hapus
                      </button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground">
                        Batal
                      </button>
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

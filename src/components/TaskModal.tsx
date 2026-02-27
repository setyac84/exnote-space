import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useMembers, useCompanies, useCreateTask, useUpdateTask } from '@/hooks/useSupabaseData';
import { X, Calendar, Flag, User, Link, AlertTriangle, Trash2, ChevronDown, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type Division = 'creative' | 'developer';

const priorityColors: Record<TaskPriority, string> = {
  low: 'text-muted-foreground bg-muted', medium: 'text-info bg-info/15', high: 'text-warning bg-warning/15', urgent: 'text-destructive bg-destructive/15',
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' }, { value: 'doing', label: 'Doing' }, { value: 'review', label: 'Review' }, { value: 'done', label: 'Done' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
];

const ModalDropdown = <T extends string>({ value, onChange, options, placeholder }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground hover:border-primary/40 transition-colors">
        <span className={!selected ? 'text-muted-foreground' : ''}>{selected?.label || placeholder || 'Select...'}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-[70] py-1 max-h-[200px] overflow-y-auto">
            {options.map(opt => (
              <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn('w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors', value === opt.value && 'font-medium bg-secondary/30')}>
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

interface TaskModalProps {
  task: any;
  division: Division;
  isOpen: boolean;
  onClose: () => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
  mode?: 'view' | 'edit' | 'create';
  projectId?: string;
}

const TaskModal = ({ task, division, isOpen, onClose, onDelete, readOnly, mode: initialMode = 'view', projectId }: TaskModalProps) => {
  const { data: allProjects = [] } = useProjects();
  const { data: allMembers = [] } = useMembers();
  const { data: companies = [] } = useCompanies();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();

  const [form, setForm] = useState<any>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const formRef = useRef<any>({});
  const isCreate = initialMode === 'create';

  const divisionMembers = allMembers.filter(u => u.division === division);
  const divisionProjects = allProjects.filter(p => p.division === division);

  useEffect(() => {
    setShowDeleteConfirm(false);
    if (isCreate) {
      const initial = {
        title: '', description: '', status: 'todo', priority: 'medium',
        assignee_id: divisionMembers[0]?.id || '', project_id: projectId || divisionProjects[0]?.id || '',
        request_date: new Date().toISOString().split('T')[0], due_date: '',
      };
      setForm(initial);
      formRef.current = initial;
    } else if (task) {
      setForm({ ...task });
      formRef.current = { ...task };
    }
  }, [task, initialMode, isOpen]);

  // Auto-save on close for existing tasks (not create, not readOnly)
  const handleClose = useCallback(async () => {
    if (!isCreate && task && !readOnly) {
      const current = formRef.current;
      // Check if anything changed
      const changed: any = {};
      let hasChanges = false;
      for (const key of Object.keys(current)) {
        if (key === 'id' || key === 'created_at' || key === 'updated_at') continue;
        if (current[key] !== task[key]) {
          changed[key] = current[key];
          hasChanges = true;
        }
      }
      if (hasChanges) {
        try {
          await updateTask.mutateAsync({ id: task.id, ...changed });
        } catch (e) {
          console.error('Auto-save failed:', e);
        }
      }
    }
    onClose();
  }, [task, isCreate, readOnly, onClose, updateTask]);

  // Keep formRef in sync
  useEffect(() => {
    formRef.current = form;
  }, [form]);

  if (!isOpen) return null;
  if (!isCreate && !task) return null;

  const inputCls = 'w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1.5 block';

  const handleCreate = async () => {
    if (!form.title?.trim()) return;
    await createTask.mutateAsync({
      title: form.title, description: form.description || '', project_id: form.project_id || projectId || '',
      assignee_id: form.assignee_id || undefined, status: form.status, priority: form.priority,
      request_date: form.request_date, due_date: form.due_date || undefined,
      moodboard_link: form.moodboard_link, aspect_ratio: form.aspect_ratio, brand_guidelines: form.brand_guidelines,
      result_link: form.result_link, content_asset_link: form.content_asset_link,
      repo_link: form.repo_link, environment: form.environment, bug_severity: form.bug_severity,
    });
    onClose();
  };

  const handleDelete = () => {
    if (task && onDelete) { onDelete(task.id); onClose(); }
  };

  const handleStatusChange = (newStatus: TaskStatus) => {
    setForm((f: any) => ({ ...f, status: newStatus }));
  };

  const projectOptions = divisionProjects.map(p => {
    const company = companies.find(c => c.id === p.company_id);
    return { value: p.id, label: company ? `${p.name} · ${company.name}` : p.name };
  });
  const assigneeOptions = divisionMembers.map(m => ({ value: m.id, label: m.name }));

  const canEdit = !readOnly;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={handleClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="glass-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex-1 min-w-0">
                  {!isCreate && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', priorityColors[form.priority as TaskPriority])}>
                        {(form.priority as string)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={handleClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 ml-2"><X className="w-5 h-5" /></button>
              </div>

              <div className="px-6 pb-6 space-y-5">
                <div>
                  <label className={labelCls}>Project</label>
                  {canEdit ? (
                    <ModalDropdown value={form.project_id || ''} onChange={(v) => setForm((f: any) => ({ ...f, project_id: v }))} options={projectOptions} placeholder="Select Project" />
                  ) : (
                    <p className="text-sm text-foreground">{projectOptions.find(o => o.value === form.project_id)?.label || '-'}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Assignee</label>
                    {canEdit ? (
                      <ModalDropdown value={form.assignee_id || ''} onChange={(v) => setForm((f: any) => ({ ...f, assignee_id: v }))} options={assigneeOptions} placeholder="Select Assignee" />
                    ) : (
                      <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-foreground">{allMembers.find(u => u.id === form.assignee_id)?.name || 'Unassigned'}</p></div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    {canEdit ? (
                      <ModalDropdown value={(form.priority as TaskPriority) || 'medium'} onChange={(v) => setForm((f: any) => ({ ...f, priority: v }))} options={priorityOptions} />
                    ) : (
                      <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-foreground capitalize">{form.priority}</p></div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Request Date</label>
                    {canEdit ? (
                      <input type="date" value={form.request_date || ''} onChange={e => setForm((f: any) => ({ ...f, request_date: e.target.value }))} className={inputCls} />
                    ) : (
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-foreground">{form.request_date || '-'}</p></div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Due Date</label>
                    {canEdit ? (
                      <input type="date" value={form.due_date || ''} onChange={e => setForm((f: any) => ({ ...f, due_date: e.target.value }))} className={inputCls} />
                    ) : (
                      <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-foreground">{form.due_date || '-'}</p></div>
                    )}
                  </div>
                </div>

                <div>
                  <label className={labelCls}>Status</label>
                  <ModalDropdown value={(form.status as TaskStatus) || 'todo'} onChange={handleStatusChange} options={statusOptions} />
                </div>

                <div>
                  <label className={labelCls}>Task Title</label>
                  {canEdit ? (
                    <input value={form.title || ''} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className={cn(inputCls, 'font-semibold')} placeholder="Task title..." />
                  ) : (
                    <h2 className="text-lg font-semibold text-foreground">{form.title}</h2>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Description</label>
                  {canEdit ? (
                    <textarea value={form.description || ''} onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))} className={cn(inputCls, 'min-h-[60px] resize-none')} placeholder="Task description..." />
                  ) : (
                    <p className="text-sm text-foreground">{form.description || '-'}</p>
                  )}
                </div>

                {/* Creative fields */}
                {division === 'creative' && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Creative Details</p>
                    <div className="space-y-3">
                      {['content_asset_link', 'moodboard_link', 'brand_guidelines', 'aspect_ratio', 'result_link'].map(field => (
                        <div key={field}>
                          <label className={labelCls}>{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                          <input value={form[field] || ''} onChange={e => setForm((f: any) => ({ ...f, [field]: e.target.value }))} className={inputCls} placeholder="..." />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Developer fields */}
                {division === 'developer' && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Developer Details</p>
                    <div className="space-y-3">
                      {canEdit ? (
                        <>
                          <div><label className={labelCls}>Repository Link</label><input value={form.repo_link || ''} onChange={e => setForm((f: any) => ({ ...f, repo_link: e.target.value }))} className={inputCls} placeholder="https://github.com/..." /></div>
                          <div><label className={labelCls}>Environment</label>
                            <ModalDropdown value={form.environment || ''} onChange={(v) => setForm((f: any) => ({ ...f, environment: v }))}
                              options={[{ value: '', label: '-' }, { value: 'staging', label: 'Staging' }, { value: 'production', label: 'Production' }]} />
                          </div>
                          <div><label className={labelCls}>Bug Severity</label>
                            <ModalDropdown value={form.bug_severity || ''} onChange={(v) => setForm((f: any) => ({ ...f, bug_severity: v }))}
                              options={[{ value: '', label: '-' }, { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'critical', label: 'Critical' }]} />
                          </div>
                        </>
                      ) : (
                        <>
                          {form.repo_link && (
                            <div className="flex items-center gap-2 text-sm">
                              <Link className="w-3.5 h-3.5 text-muted-foreground" />
                              <a href={form.repo_link} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{form.repo_link}</a>
                            </div>
                          )}
                          {form.environment && <p className="text-sm text-foreground capitalize">Environment: {form.environment}</p>}
                          {form.bug_severity && (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" /><span className="capitalize">Bug Severity: {form.bug_severity}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  {isCreate && (
                    <button onClick={handleCreate} disabled={!form.title?.trim() || createTask.isPending}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                      <Save className="w-3.5 h-3.5" /> Create Task
                    </button>
                  )}
                  {!isCreate && onDelete && !readOnly && (
                    <>
                      {!showDeleteConfirm ? (
                        <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      ) : (
                        <div className="w-full bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                          <p className="text-sm text-foreground mb-3">Are you sure you want to delete this task?</p>
                          <div className="flex gap-2">
                            <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90">Yes, Delete</button>
                            <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground">Cancel</button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                  {!isCreate && !readOnly && !showDeleteConfirm && (
                    <p className="text-[11px] text-muted-foreground ml-auto">Changes saved automatically</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default TaskModal;

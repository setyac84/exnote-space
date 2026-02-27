import { useState, useEffect } from 'react';
import { Task, Division, TaskStatus, TaskPriority } from '@/types';
import { mockUsers, mockProjects, mockCompanies } from '@/data/mock';
import { X, Calendar, Flag, User, Link, AlertTriangle, Pencil, Trash2, Save, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatDate';

const priorityColors: Record<TaskPriority, string> = {
  low: 'text-muted-foreground bg-muted',
  medium: 'text-info bg-info/15',
  high: 'text-warning bg-warning/15',
  urgent: 'text-destructive bg-destructive/15',
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'doing', label: 'Doing' },
  { value: 'review', label: 'Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// Custom dropdown component matching InlineStatusDropdown style
const ModalDropdown = <T extends string>({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground hover:border-primary/40 transition-colors"
      >
        <span className={!selected ? 'text-muted-foreground' : ''}>{selected?.label || placeholder || 'Pilih...'}</span>
        <ChevronDown className="w-4 h-4 text-muted-foreground" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-xl shadow-lg z-[70] py-1 max-h-[200px] overflow-y-auto">
            {options.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm hover:bg-secondary/50 transition-colors',
                  value === opt.value && 'font-medium bg-secondary/30'
                )}
              >
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
  task: Task | null;
  division: Division;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (task: Task) => void;
  onDelete?: (id: string) => void;
  readOnly?: boolean;
  mode?: 'view' | 'edit' | 'create';
  projectId?: string;
}

const TaskModal = ({ task, division, isOpen, onClose, onUpdate, onDelete, readOnly, mode: initialMode = 'view', projectId }: TaskModalProps) => {
  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(initialMode);
  const [form, setForm] = useState<Partial<Task>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const divisionMembers = mockUsers.filter(u => u.division === division);
  const divisionProjects = mockProjects.filter(p => p.division === division);

  useEffect(() => {
    setMode(initialMode);
    setShowDeleteConfirm(false);
    if (initialMode === 'create') {
      setForm({
        title: '',
        description: '',
        status: 'todo',
        priority: 'medium',
        assignee_id: divisionMembers[0]?.id || '',
        project_id: projectId || divisionProjects[0]?.id || '',
        request_date: new Date().toISOString().split('T')[0],
        due_date: '',
      });
    } else if (task) {
      setForm({ ...task });
    }
  }, [task, initialMode, isOpen]);

  if (!isOpen) return null;
  if (initialMode !== 'create' && !task) return null;

  const isEditable = mode === 'edit' || mode === 'create';
  const assignee = mockUsers.find(u => u.id === (form.assignee_id || task?.assignee_id));
  const inputCls = 'w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1.5 block';

  const getProjectWithCompany = (projectId: string) => {
    const project = divisionProjects.find(p => p.id === projectId);
    if (!project) return '-';
    const company = mockCompanies.find(c => c.id === project.company_id);
    return company ? `${project.name} · ${company.name}` : project.name;
  };

  const handleSave = () => {
    if (!form.title?.trim()) return;
    if (mode === 'create') {
      const newTask: Task = {
        id: `t${Date.now()}`,
        title: form.title || '',
        description: form.description || '',
        status: (form.status as TaskStatus) || 'todo',
        priority: (form.priority as TaskPriority) || 'medium',
        assignee_id: form.assignee_id || '',
        project_id: form.project_id || projectId || '',
        request_date: form.request_date || '',
        due_date: form.due_date || '',
        moodboard_link: form.moodboard_link,
        aspect_ratio: form.aspect_ratio,
        brand_guidelines: form.brand_guidelines,
        result_link: form.result_link,
        content_asset_link: form.content_asset_link,
        repo_link: form.repo_link,
        environment: form.environment,
        bug_severity: form.bug_severity,
      };
      onUpdate(newTask);
    } else {
      onUpdate({ ...task!, ...form } as Task);
    }
    onClose();
  };

  const handleDelete = () => {
    if (task && onDelete) {
      onDelete(task.id);
      onClose();
    }
  };

  const displayTask = { ...task, ...form };

  const projectOptions = divisionProjects.map(p => {
    const company = mockCompanies.find(c => c.id === p.company_id);
    return { value: p.id, label: company ? `${p.name} · ${company.name}` : p.name };
  });
  const assigneeOptions = divisionMembers.map(m => ({ value: m.id, label: m.name }));

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
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex-1 min-w-0">
                  {!isEditable && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', priorityColors[displayTask.priority as TaskPriority])}>
                        {(displayTask.priority as string)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 ml-2">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-6 pb-6 space-y-5">
                {/* 1. Project Selection */}
                <div>
                  <label className={labelCls}>Project</label>
                  {isEditable ? (
                    <ModalDropdown
                      value={form.project_id || ''}
                      onChange={(v) => setForm(f => ({ ...f, project_id: v }))}
                      options={projectOptions}
                      placeholder="Pilih Project"
                    />
                  ) : (
                    <p className="text-sm text-foreground">{getProjectWithCompany(displayTask.project_id as string)}</p>
                  )}
                </div>

                {/* 2. Assignee, Priority, Request Date, Due Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Assignee</label>
                    {isEditable ? (
                      <ModalDropdown
                        value={form.assignee_id || ''}
                        onChange={(v) => setForm(f => ({ ...f, assignee_id: v }))}
                        options={assigneeOptions}
                        placeholder="Pilih Assignee"
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-foreground">{assignee?.name || 'Unassigned'}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    {isEditable ? (
                      <ModalDropdown
                        value={(form.priority as TaskPriority) || 'medium'}
                        onChange={(v) => setForm(f => ({ ...f, priority: v as TaskPriority }))}
                        options={priorityOptions}
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Flag className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-foreground capitalize">{displayTask.priority}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Request Date</label>
                    {isEditable ? (
                      <input type="date" value={form.request_date || ''} onChange={e => setForm(f => ({ ...f, request_date: e.target.value }))} className={inputCls} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-foreground">{formatDate(displayTask.request_date as string)}</p>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Due Date</label>
                    {isEditable ? (
                      <input type="date" value={form.due_date || ''} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} className={inputCls} />
                    ) : (
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <p className="text-sm text-foreground">{formatDate(displayTask.due_date as string)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status */}
                <div>
                  <label className={labelCls}>Status</label>
                  {isEditable || !readOnly ? (
                    <ModalDropdown
                      value={(form.status as TaskStatus) || (displayTask.status as TaskStatus) || 'todo'}
                      onChange={(v) => {
                        const newStatus = v as TaskStatus;
                        setForm(f => ({ ...f, status: newStatus }));
                        if (!isEditable && task) {
                          onUpdate({ ...task, status: newStatus });
                        }
                      }}
                      options={statusOptions}
                    />
                  ) : (
                    <span className="text-sm text-foreground capitalize">{displayTask.status}</span>
                  )}
                </div>

                {/* 3. Task Title & Description */}
                <div>
                  <label className={labelCls}>Judul Task</label>
                  {isEditable ? (
                    <input
                      value={form.title || ''}
                      onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      className={cn(inputCls, 'font-semibold')}
                      placeholder="Judul task..."
                    />
                  ) : (
                    <h2 className="text-lg font-semibold text-foreground">{displayTask.title}</h2>
                  )}
                </div>
                <div>
                  <label className={labelCls}>Deskripsi</label>
                  {isEditable ? (
                    <textarea
                      value={form.description || ''}
                      onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      className={cn(inputCls, 'min-h-[60px] resize-none')}
                      placeholder="Deskripsi task..."
                    />
                  ) : (
                    <p className="text-sm text-foreground">{displayTask.description}</p>
                  )}
                </div>

                {/* 4. Creative fields */}
                {division === 'creative' && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Detail Creative</p>
                    <div className="space-y-3">
                      {isEditable ? (
                        <>
                          <div>
                            <label className={labelCls}>Content Asset</label>
                            <input value={form.content_asset_link || ''} onChange={e => setForm(f => ({ ...f, content_asset_link: e.target.value }))} className={inputCls} placeholder="Link atau deskripsi asset..." />
                          </div>
                          <div>
                            <label className={labelCls}>Moodboard</label>
                            <input value={form.moodboard_link || ''} onChange={e => setForm(f => ({ ...f, moodboard_link: e.target.value }))} className={inputCls} placeholder="Link atau deskripsi moodboard..." />
                          </div>
                          <div>
                            <label className={labelCls}>Visual Direction</label>
                            <input value={form.brand_guidelines || ''} onChange={e => setForm(f => ({ ...f, brand_guidelines: e.target.value }))} className={inputCls} placeholder="Modern, minimalist, bold colors..." />
                          </div>
                          <div>
                            <label className={labelCls}>Deliverables</label>
                            <input value={form.aspect_ratio || ''} onChange={e => setForm(f => ({ ...f, aspect_ratio: e.target.value }))} className={inputCls} placeholder="16:9, 1:1, A4 poster..." />
                          </div>
                          <div>
                            <label className={labelCls}>Result Link</label>
                            <input value={form.result_link || ''} onChange={e => setForm(f => ({ ...f, result_link: e.target.value }))} className={inputCls} placeholder="https://..." />
                          </div>
                        </>
                      ) : (
                        <>
                          {displayTask.content_asset_link && (
                            <p className="text-sm text-foreground">Content Asset: {displayTask.content_asset_link as string}</p>
                          )}
                          {displayTask.moodboard_link && (
                            <p className="text-sm text-foreground">Moodboard: {displayTask.moodboard_link as string}</p>
                          )}
                          {displayTask.brand_guidelines && <p className="text-sm text-foreground">Visual Direction: {displayTask.brand_guidelines as string}</p>}
                          {displayTask.aspect_ratio && <p className="text-sm text-foreground">Deliverables: {displayTask.aspect_ratio as string}</p>}
                          {displayTask.result_link && (
                            <div className="flex items-center gap-2 text-sm">
                              <Link className="w-3.5 h-3.5 text-muted-foreground" />
                              <a href={displayTask.result_link as string} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">Result Link</a>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Developer fields */}
                {division === 'developer' && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Detail Developer</p>
                    <div className="space-y-3">
                      {isEditable ? (
                        <>
                          <div>
                            <label className={labelCls}>Repository Link</label>
                            <input value={form.repo_link || ''} onChange={e => setForm(f => ({ ...f, repo_link: e.target.value }))} className={inputCls} placeholder="https://github.com/..." />
                          </div>
                          <div>
                            <label className={labelCls}>Environment</label>
                            <ModalDropdown
                              value={form.environment || ''}
                              onChange={(v) => setForm(f => ({ ...f, environment: v as any }))}
                              options={[
                                { value: '', label: '-' },
                                { value: 'staging', label: 'Staging' },
                                { value: 'production', label: 'Production' },
                              ]}
                            />
                          </div>
                          <div>
                            <label className={labelCls}>Bug Severity</label>
                            <ModalDropdown
                              value={form.bug_severity || ''}
                              onChange={(v) => setForm(f => ({ ...f, bug_severity: v as any }))}
                              options={[
                                { value: '', label: '-' },
                                { value: 'low', label: 'Low' },
                                { value: 'medium', label: 'Medium' },
                                { value: 'high', label: 'High' },
                                { value: 'critical', label: 'Critical' },
                              ]}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          {displayTask.repo_link && (
                            <div className="flex items-center gap-2 text-sm">
                              <Link className="w-3.5 h-3.5 text-muted-foreground" />
                              <a href={displayTask.repo_link as string} target="_blank" rel="noreferrer" className="text-primary hover:underline truncate">{displayTask.repo_link as string}</a>
                            </div>
                          )}
                          {displayTask.environment && <p className="text-sm text-foreground capitalize">Environment: {displayTask.environment as string}</p>}
                          {displayTask.bug_severity && (
                            <div className="flex items-center gap-2 text-sm">
                              <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                              <span className="capitalize">Bug Severity: {displayTask.bug_severity as string}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t border-border">
                  {mode === 'view' && !readOnly && (
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
                        disabled={!form.title?.trim()}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      {mode === 'edit' && (
                        <button onClick={() => { setMode('view'); setForm(task ? { ...task } : {}); }} className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
                          Batal
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Delete Confirmation */}
                {showDeleteConfirm && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-foreground mb-3">Yakin ingin menghapus task ini?</p>
                    <div className="flex gap-2">
                      <button onClick={handleDelete} className="px-3 py-1.5 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90">Ya, Hapus</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm rounded-lg bg-secondary text-secondary-foreground">Batal</button>
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

export default TaskModal;

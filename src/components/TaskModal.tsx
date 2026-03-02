import { useState, useEffect, useRef } from 'react';
import { useProjects, useMembers, useCompanies, useCreateTask, useUpdateTask, useTaskAssignees, useSetTaskAssignees } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { X, Calendar as CalendarIcon, Flag, User, Link, AlertTriangle, Trash2, ChevronDown, Save, Pencil, Image, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/formatDate';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type TaskStatus = 'todo' | 'doing' | 'review' | 'done';
type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
type Division = 'creative' | 'developer' | 'management';

const priorityColors: Record<TaskPriority, string> = {
  low: 'text-muted-foreground bg-muted', medium: 'text-info bg-info/15', high: 'text-warning bg-warning/15', urgent: 'text-destructive bg-destructive/15',
};

const statusOptions: { value: TaskStatus; label: string }[] = [
  { value: 'todo', label: 'To Do' }, { value: 'doing', label: 'Doing' }, { value: 'review', label: 'Review' }, { value: 'done', label: 'Done' },
];

const priorityOptions: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' },
];

// Custom labels for creative fields
const creativeFieldLabels: Record<string, string> = {
  content_asset_link: 'Content Asset',
  moodboard_link: 'Reference',
  brand_guidelines: 'Visual Direction',
  aspect_ratio: 'Aspect Ratio',
  result_link: 'Result Link',
};

const ModalDropdown = <T extends string>({ value, onChange, options, placeholder }: {
  value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; placeholder?: string;
}) => {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);
  return (
    <div>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground hover:border-primary/40 transition-colors">
        <span className={!selected ? 'text-muted-foreground' : ''}>{selected?.label || placeholder || 'Select...'}</span>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-1.5 bg-popover border border-border rounded-2xl shadow-xl p-2.5 max-h-[220px] overflow-y-auto space-y-1">
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => { onChange(opt.value); setOpen(false); }}
              className={cn('w-full text-left px-3 py-2 text-sm rounded-xl transition-colors', value === opt.value ? 'font-medium bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60 hover:text-accent-foreground')}>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Multi-select assignee dropdown
const MultiAssigneeSelect = ({ selected, onChange, options }: {
  selected: string[]; onChange: (ids: string[]) => void; options: { value: string; label: string }[];
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const toggleAssignee = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const selectedLabels = selected.map(id => options.find(o => o.value === id)?.label).filter(Boolean);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground hover:border-primary/40 transition-colors min-h-[40px]">
        <div className="flex flex-wrap gap-1 flex-1">
          {selectedLabels.length > 0 ? selectedLabels.map((name, i) => (
            <span key={i} className="bg-primary/15 text-primary text-xs font-medium px-2 py-0.5 rounded-md">{name}</span>
          )) : (
            <span className="text-muted-foreground">Select assignees...</span>
          )}
        </div>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform ml-2 shrink-0", open && "rotate-180")} />
      </button>
      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-2xl shadow-xl z-[70] p-1.5 max-h-[220px] overflow-y-auto space-y-0.5">
          {options.map(opt => (
            <button key={opt.value} type="button" onClick={() => toggleAssignee(opt.value)}
              className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-sm rounded-xl transition-colors',
                selected.includes(opt.value) ? 'font-medium bg-accent text-accent-foreground' : 'text-foreground hover:bg-accent/60 hover:text-accent-foreground')}>
              <div className={cn('w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors',
                selected.includes(opt.value) ? 'border-primary bg-primary' : 'border-muted-foreground/40')}>
                {selected.includes(opt.value) && <Check className="w-3 h-3 text-primary-foreground" />}
              </div>
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Rich textarea with image paste support
const RichTextArea = ({ value, onChange, placeholder, className, id }: {
  value: string; onChange: (v: string) => void; placeholder?: string; className?: string; id?: string;
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [uploading, setUploading] = useState(false);

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of Array.from(items)) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) continue;

        setUploading(true);
        try {
          const ext = file.type.split('/')[1] || 'png';
          const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const filePath = `uploads/${fileName}`;

          const { error } = await supabase.storage.from('task-images').upload(filePath, file);
          if (error) throw error;

          const { data: urlData } = supabase.storage.from('task-images').getPublicUrl(filePath);
          const imageUrl = urlData.publicUrl;

          // Insert image URL at cursor position
          const textarea = textareaRef.current;
          if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const before = value.slice(0, start);
            const after = value.slice(end);
            const imageText = `${before ? '\n' : ''}[image: ${imageUrl}]\n`;
            onChange(before + imageText + after);
          } else {
            onChange(value + `\n[image: ${imageUrl}]\n`);
          }
        } catch (err) {
          console.error('Image upload failed:', err);
        } finally {
          setUploading(false);
        }
      }
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.max(60, el.scrollHeight) + 'px';
    }
  }, [value]);

  return (
    <div className="relative">
      <textarea
        id={id}
        ref={textareaRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        className={cn(className, 'min-h-[60px] resize-none')}
      />
      {uploading && (
        <div className="absolute right-2 top-2 flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/80 px-2 py-0.5 rounded-full">
          <Image className="w-3 h-3 animate-pulse" /> Uploading...
        </div>
      )}
    </div>
  );
};

// Render rich text content (text + images)
const RichTextDisplay = ({ value }: { value: string }) => {
  if (!value || value === '-') return <p className="text-sm text-foreground">-</p>;

  const parts = value.split(/(\[image: [^\]]+\])/g);
  return (
    <div className="space-y-2">
      {parts.map((part, i) => {
        const imageMatch = part.match(/^\[image: ([^\]]+)\]$/);
        if (imageMatch) {
          return (
            <a key={i} href={imageMatch[1]} target="_blank" rel="noreferrer">
              <img src={imageMatch[1]} alt="Pasted" className="max-w-full max-h-[200px] rounded-lg border border-border object-contain" />
            </a>
          );
        }
        if (!part.trim()) return null;
        return (
          <p key={i} className="text-sm text-foreground whitespace-pre-wrap break-words">{part}</p>
        );
      })}
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
  const { data: allTaskAssignees = [] } = useTaskAssignees();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const setTaskAssignees = useSetTaskAssignees();

  const [mode, setMode] = useState<'view' | 'edit' | 'create'>(initialMode);
  const [form, setForm] = useState<any>({});
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isCreate = initialMode === 'create';
  const isEditing = mode === 'edit';
  const divisionMembers = allMembers.filter(u => u.division === division && u.role !== 'super_admin');
  const divisionProjects = allProjects.filter(p => p.division === division);

  useEffect(() => {
    setMode(initialMode);
    setShowDeleteConfirm(false);
    if (isCreate) {
      setForm({
        title: '', description: '', status: 'todo', priority: 'medium',
        assignee_id: '', project_id: projectId || divisionProjects[0]?.id || '',
        request_date: new Date().toISOString().split('T')[0], due_date: '',
      });
      setSelectedAssignees([]);
    } else if (task) {
      setForm({ ...task });
      const taskAssigneeIds = allTaskAssignees.filter(ta => ta.task_id === task.id).map(ta => ta.assignee_id);
      setSelectedAssignees(taskAssigneeIds.length > 0 ? taskAssigneeIds : (task.assignee_id ? [task.assignee_id] : []));
    }
  }, [task, initialMode, isOpen]);

  if (!isOpen) return null;
  if (!isCreate && !task) return null;

  const canEdit = !readOnly;
  const isEditable = isEditing || isCreate;
  const inputCls = 'w-full bg-secondary/50 border border-border rounded-xl px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary';
  const labelCls = 'text-xs font-medium text-muted-foreground mb-1.5 block';

  const getProjectWithCompany = (pid: string) => {
    const project = divisionProjects.find(p => p.id === pid);
    if (!project) return '-';
    const company = companies.find(c => c.id === project.company_id);
    return company ? `${project.name} · ${company.name}` : project.name;
  };

  const handleSave = async () => {
    if (!form.title?.trim()) return;
    if (isCreate) {
      const result = await createTask.mutateAsync({
        title: form.title, description: form.description || '', project_id: form.project_id || projectId || '',
        assignee_id: selectedAssignees[0] || undefined, status: form.status, priority: form.priority,
        request_date: form.request_date, due_date: form.due_date || undefined,
        moodboard_link: form.moodboard_link, aspect_ratio: form.aspect_ratio, brand_guidelines: form.brand_guidelines,
        result_link: form.result_link, content_asset_link: form.content_asset_link,
        repo_link: form.repo_link, environment: form.environment, bug_severity: form.bug_severity,
      });
      if (result?.id) {
        await setTaskAssignees.mutateAsync({ taskId: result.id, assigneeIds: selectedAssignees });
      }
      onClose();
    } else {
      const { id, created_at, updated_at, ...updates } = form;
      updates.assignee_id = selectedAssignees[0] || null;
      await updateTask.mutateAsync({ id: task.id, ...updates });
      await setTaskAssignees.mutateAsync({ taskId: task.id, assigneeIds: selectedAssignees });
      setMode('view');
    }
  };

  const handleStatusChange = async (newStatus: TaskStatus) => {
    setForm((f: any) => ({ ...f, status: newStatus }));
    if (!isEditable && task) {
      await updateTask.mutateAsync({ id: task.id, status: newStatus });
    }
  };

  const handleDelete = () => {
    if (task && onDelete) { onDelete(task.id); onClose(); }
  };

  const handleCancel = () => {
    setMode('view');
    if (task) setForm({ ...task });
  };

  // Save a single field inline (for result_link in view mode)
  const handleInlineFieldSave = async (field: string, value: string) => {
    setForm((f: any) => ({ ...f, [field]: value }));
    if (!isEditable && task) {
      await updateTask.mutateAsync({ id: task.id, [field]: value });
    }
  };

  const projectOptions = divisionProjects.map(p => {
    const company = companies.find(c => c.id === p.company_id);
    return { value: p.id, label: company ? `${p.name} · ${company.name}` : p.name };
  });
  const assigneeOptions = divisionMembers.map(m => ({ value: m.id, label: m.name }));
  const selectedAssigneeNames = selectedAssignees.map(id => allMembers.find(u => u.id === id)).filter(Boolean);

  // Creative fields (excluding result_link which is handled separately)
  const creativeTextFields = ['content_asset_link', 'moodboard_link', 'brand_guidelines', 'aspect_ratio'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50" onClick={onClose} />
          <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="glass-card rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-start justify-between p-6 pb-4">
                <div className="flex-1 min-w-0">
                  {!isEditable && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', priorityColors[form.priority as TaskPriority])}>
                        {(form.priority as string)?.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1 ml-2"><X className="w-5 h-5" /></button>
              </div>

              <div className="px-6 pb-6 space-y-5">
                {/* Project */}
                <div>
                  <label className={labelCls}>Project</label>
                  {isEditable ? (
                    <ModalDropdown value={form.project_id || ''} onChange={(v) => setForm((f: any) => ({ ...f, project_id: v }))} options={projectOptions} placeholder="Select Project" />
                  ) : (
                    <p className="text-sm text-foreground">{getProjectWithCompany(form.project_id)}</p>
                  )}
                </div>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelCls}>Assignee</label>
                    {isEditable ? (
                      <MultiAssigneeSelect
                        selected={selectedAssignees}
                        onChange={setSelectedAssignees}
                        options={assigneeOptions}
                      />
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedAssigneeNames.length > 0 ? selectedAssigneeNames.map((a: any) => (
                          <div key={a.id} className="flex items-center gap-1.5 bg-secondary/50 rounded-full px-2 py-1">
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[7px] font-bold text-primary">
                              {a.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span className="text-xs text-foreground">{a.name.split(' ')[0]}</span>
                          </div>
                        )) : (
                          <div className="flex items-center gap-2"><User className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-foreground">Unassigned</p></div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    {isEditable ? (
                      <ModalDropdown value={(form.priority as TaskPriority) || 'medium'} onChange={(v) => setForm((f: any) => ({ ...f, priority: v }))} options={priorityOptions} />
                    ) : (
                      <div className="flex items-center gap-2"><Flag className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-foreground capitalize">{form.priority}</p></div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Request Date</label>
                    {isEditable ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className={cn(inputCls, 'flex items-center justify-between text-left', !form.request_date && 'text-muted-foreground')}>
                            <span>{form.request_date ? format(parseISO(form.request_date), 'd MMM yyyy') : 'Pick a date'}</span>
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl" align="start" sideOffset={4}>
                          <Calendar mode="single" selected={form.request_date ? parseISO(form.request_date) : undefined} onSelect={(d) => setForm((f: any) => ({ ...f, request_date: d ? format(d, 'yyyy-MM-dd') : '' }))} initialFocus className="p-3 pointer-events-auto rounded-xl" />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-foreground">{formatDate(form.request_date)}</p></div>
                    )}
                  </div>
                  <div>
                    <label className={labelCls}>Due Date</label>
                    {isEditable ? (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button type="button" className={cn(inputCls, 'flex items-center justify-between text-left', !form.due_date && 'text-muted-foreground')}>
                            <span>{form.due_date ? format(parseISO(form.due_date), 'd MMM yyyy') : 'Pick a date'}</span>
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 rounded-xl" align="start" sideOffset={4}>
                          <Calendar mode="single" selected={form.due_date ? parseISO(form.due_date) : undefined} onSelect={(d) => setForm((f: any) => ({ ...f, due_date: d ? format(d, 'yyyy-MM-dd') : '' }))} initialFocus className="p-3 pointer-events-auto rounded-xl" />
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div className="flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-muted-foreground" /><p className="text-sm text-foreground">{formatDate(form.due_date)}</p></div>
                    )}
                  </div>
                </div>

                {/* Status - always interactive */}
                <div>
                  <label className={labelCls}>Status</label>
                  <ModalDropdown value={(form.status as TaskStatus) || 'todo'} onChange={handleStatusChange} options={statusOptions} />
                </div>

                {/* Title */}
                <div>
                  <label className={labelCls}>Task Title</label>
                  {isEditable ? (
                    <input value={form.title || ''} onChange={e => setForm((f: any) => ({ ...f, title: e.target.value }))} className={cn(inputCls, 'font-semibold')} placeholder="Task title..." />
                  ) : (
                    <h2 className="text-lg font-semibold text-foreground">{form.title}</h2>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className={labelCls}>Description</label>
                  {isEditable ? (
                    <RichTextArea value={form.description || ''} onChange={v => setForm((f: any) => ({ ...f, description: v }))} className={inputCls} placeholder="Task description..." />
                  ) : (
                    <RichTextDisplay value={form.description || '-'} />
                  )}
                </div>

                {/* Creative fields - Visual Brief */}
                {division === 'creative' && (
                  <div className="border-t border-border pt-4">
                    <h3 className="text-sm font-bold text-foreground mb-4">Visual Brief</h3>
                    <div className="space-y-4">
                      {/* Reference (moodboard_link) */}
                      <div>
                        <label className={labelCls}>Reference</label>
                        {isEditable ? (
                          <RichTextArea
                            value={form.moodboard_link || ''}
                            onChange={v => setForm((f: any) => ({ ...f, moodboard_link: v }))}
                            className={inputCls}
                            placeholder="Paste reference link or image..."
                          />
                        ) : (
                          <RichTextDisplay value={form.moodboard_link || '-'} />
                        )}
                      </div>

                      {/* Aspect Ratio */}
                      <div>
                        <label className={labelCls}>Aspect Ratio</label>
                        {isEditable ? (
                          <input
                            value={form.aspect_ratio || ''}
                            onChange={e => setForm((f: any) => ({ ...f, aspect_ratio: e.target.value }))}
                            className={inputCls}
                            placeholder="e.g. 16:9, 1:1, 9:16..."
                          />
                        ) : (
                          <p className="text-sm text-foreground">{form.aspect_ratio || '-'}</p>
                        )}
                      </div>

                      {/* Visual Notes (brand_guidelines) */}
                      <div>
                        <label className={labelCls}>Visual Notes</label>
                        {isEditable ? (
                          <RichTextArea
                            value={form.brand_guidelines || ''}
                            onChange={v => setForm((f: any) => ({ ...f, brand_guidelines: v }))}
                            className={inputCls}
                            placeholder="Describe visual needs, reference, sizes, colors..."
                          />
                        ) : (
                          <RichTextDisplay value={form.brand_guidelines || '-'} />
                        )}
                      </div>

                      {/* Asset Content */}
                      <div>
                        <label className={labelCls}>Asset Content</label>
                        {isEditable ? (
                          <RichTextArea
                            value={form.content_asset_link || ''}
                            onChange={v => setForm((f: any) => ({ ...f, content_asset_link: v }))}
                            className={inputCls}
                            placeholder="Type or paste content asset..."
                          />
                        ) : (
                          <RichTextDisplay value={form.content_asset_link || '-'} />
                        )}
                      </div>

                      {/* Result Link - always editable inline */}
                      <div>
                        <label className={labelCls}>Result Link</label>
                        <div className="space-y-1.5">
                          <input
                            value={form.result_link || ''}
                            onChange={e => setForm((f: any) => ({ ...f, result_link: e.target.value }))}
                            onBlur={e => {
                              if (!isEditable && task && e.target.value !== task.result_link) {
                                handleInlineFieldSave('result_link', e.target.value);
                              }
                            }}
                            className={inputCls}
                            placeholder="Paste result link..."
                          />
                          {form.result_link && (
                            <a href={form.result_link} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                              <Link className="w-3 h-3" /> Open link
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Developer fields */}
                {division === 'developer' && (
                  <div className="border-t border-border pt-4">
                    <p className="text-xs font-medium text-muted-foreground mb-3">Developer Details</p>
                    <div className="space-y-3">
                      {isEditable ? (
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
                  {mode === 'view' && canEdit && (
                    <>
                      <button onClick={() => setMode('edit')} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>
                      {onDelete && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      )}
                    </>
                  )}
                  {isEditable && (
                    <>
                      <button onClick={handleSave} disabled={!form.title?.trim() || createTask.isPending || updateTask.isPending}
                        className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50">
                        <Save className="w-3.5 h-3.5" /> Save
                      </button>
                      {isEditing && (
                        <button onClick={handleCancel} className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">Cancel</button>
                      )}
                    </>
                  )}
                </div>

                {showDeleteConfirm && (
                  <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                    <p className="text-sm text-foreground mb-3">Are you sure you want to delete this task?</p>
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

export default TaskModal;

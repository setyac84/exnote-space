import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '@/hooks/useSupabaseData';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, StickyNote, Search, ArrowLeft, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from 'sonner';

const NotepadPage = () => {
  const { user } = useAuth();
  const { data: notes = [], isLoading } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!user) return null;

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const selectedNote = notes.find(n => n.id === selectedId);

  const handleCreate = async () => {
    try {
      const note = await createNote.mutateAsync({ title: 'Untitled Note', content: '', user_id: user.id });
      setSelectedId(note.id);
      setEditTitle('Untitled Note');
      setEditContent('');
    } catch (e: any) {
      toast.error(e.message || 'Failed to create note');
    }
  };

  const handleSelect = (note: any) => {
    // Save current note before switching
    if (selectedId && selectedId !== note.id) {
      handleSave();
    }
    setSelectedId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const handleSave = async (andClose = false) => {
    if (!selectedId) return;
    setSaving(true);
    try {
      await updateNote.mutateAsync({ id: selectedId, title: editTitle.trim() || 'Untitled', content: editContent });
      if (andClose) {
        setSelectedId(null);
        toast.success('Note saved');
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNote.mutateAsync(id);
      if (selectedId === id) {
        setSelectedId(null);
      }
      toast.success('Note deleted');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-2 lg:px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <StickyNote className="w-6 h-6 text-primary" />
         <h1 className="text-xl sm:text-2xl font-bold text-foreground">My Notepad</h1>
        </div>
        <p className="text-sm text-muted-foreground">Your private notes — visible only to you.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 lg:gap-5 min-h-[60vh]">
        {/* Note List */}
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
          className={cn("glass-card rounded-xl p-4 flex flex-col gap-3", selectedId && "hidden lg:flex")}>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search notes..." value={search} onChange={e => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm" />
            </div>
            <Button size="icon" variant="default" className="h-9 w-9 shrink-0" onClick={handleCreate}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
              <StickyNote className="w-10 h-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">No notes yet</p>
              <p className="text-xs text-muted-foreground mt-1">Click + to create your first note</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto space-y-1 -mx-1 px-1">
              <AnimatePresence>
                {filtered.map(note => (
                  <motion.div key={note.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                    onClick={() => handleSelect(note)}
                    className={cn(
                      "group p-3 rounded-lg cursor-pointer transition-colors",
                      selectedId === note.id ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50"
                    )}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">{note.title || 'Untitled'}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{note.content || 'No content'}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{format(new Date(note.updated_at), 'd MMM yyyy, HH:mm')}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(note.id); }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Note Editor */}
        <motion.div initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
          className={cn("glass-card rounded-xl p-5 flex flex-col", !selectedId && "hidden lg:flex")}>
          {selectedNote ? (
            <>
              <div className="flex items-center gap-2 mb-4 lg:hidden">
                <button onClick={() => setSelectedId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <span className="text-sm text-muted-foreground">Back to notes</span>
              </div>
              <Input
                value={editTitle}
                onChange={e => setEditTitle(e.target.value)}
                onBlur={() => handleSave()}
                placeholder="Note title..."
                className="text-lg font-semibold border-none shadow-none focus-visible:ring-0 px-3 mb-2"
              />
              <Textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                onBlur={() => handleSave()}
                placeholder="Start writing..."
                className="flex-1 border-none shadow-none focus-visible:ring-0 px-3 resize-none min-h-[300px] text-sm"
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                <p className="text-[10px] text-muted-foreground">
                  Last updated: {format(new Date(selectedNote.updated_at), 'd MMM yyyy, HH:mm')}
                </p>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-muted-foreground">{saving ? 'Saving...' : 'Auto-saved'}</span>
                  <button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" /> Save & Close
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <StickyNote className="w-12 h-12 text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">Select a note or create a new one</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Note</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 justify-end mt-2">
            <button onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 text-sm rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors">
              Cancel
            </button>
            <button onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">
              Delete
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default NotepadPage;

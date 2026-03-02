import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, FolderKanban, ListTodo } from 'lucide-react';
import { useProjects, useTasks } from '@/hooks/useSupabaseData';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { activeDivision } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
      if (e.key === 'Escape') {
        setOpen(false);
        setQuery('');
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const q = query.toLowerCase().trim();

  const filteredProjects = q
    ? projects.filter(p => p.division_id === activeDivision && p.name.toLowerCase().includes(q)).slice(0, 5)
    : [];

  const filteredTasks = q
    ? tasks.filter(t => {
        const project = projects.find(p => p.id === t.project_id);
        return project?.division_id === activeDivision && t.title.toLowerCase().includes(q);
      }).slice(0, 5)
    : [];

  const hasResults = filteredProjects.length > 0 || filteredTasks.length > 0;

  const handleSelect = (type: 'project' | 'task', id: string) => {
    setOpen(false);
    setQuery('');
    if (type === 'project') {
      navigate(`/tasks?project=${id}`);
    } else {
      navigate(`/tasks`);
    }
  };

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-secondary/60 border border-border rounded-lg hover:border-primary/30 hover:text-foreground transition-colors w-full max-w-xs sm:max-w-sm"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left truncate">Search tasks or projects...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground bg-muted rounded">
          ⌘K
        </kbd>
      </button>

      {/* Overlay */}
      {open && (
        <>
          <div className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[60]" onClick={() => { setOpen(false); setQuery(''); }} />
          <div className="fixed top-[15%] left-1/2 -translate-x-1/2 z-[60] w-[90vw] max-w-md">
            <div className="bg-popover border border-border rounded-2xl shadow-xl overflow-hidden">
              {/* Search input */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Search className="w-4 h-4 text-muted-foreground shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search tasks or projects..."
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
                {query && (
                  <button onClick={() => setQuery('')} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Results */}
              {q && (
                <div className="max-h-[50vh] overflow-y-auto p-2">
                  {filteredProjects.length > 0 && (
                    <div className="mb-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">Projects</p>
                      {filteredProjects.map(p => (
                        <button key={p.id} onClick={() => handleSelect('project', p.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary/50 transition-colors text-left">
                          <FolderKanban className="w-4 h-4 text-primary shrink-0" />
                          <span className="truncate">{p.name}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground capitalize">{p.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {filteredTasks.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-2 py-1">Tasks</p>
                      {filteredTasks.map(t => (
                        <button key={t.id} onClick={() => handleSelect('task', t.id)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground rounded-lg hover:bg-secondary/50 transition-colors text-left">
                          <ListTodo className="w-4 h-4 text-info shrink-0" />
                          <span className="truncate">{t.title}</span>
                          <span className="ml-auto text-[10px] text-muted-foreground capitalize">{t.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!hasResults && (
                    <p className="text-center text-sm text-muted-foreground py-6">No results found.</p>
                  )}
                </div>
              )}

              {!q && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Type to search tasks and projects...
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default GlobalSearch;

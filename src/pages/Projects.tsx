import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useTasks, useCompanies, useUpdateProject } from '@/hooks/useSupabaseData';
import ProjectCard from '@/components/ProjectCard';
import ProjectModal from '@/components/ProjectModal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import FilterDropdown from '@/components/FilterDropdown';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

type ProjectTab = 'all' | 'completed' | 'archived';

const Projects = () => {
  const { user, activeDivision, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: allProjects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: companies = [] } = useCompanies();
  const updateProjectMutation = useUpdateProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [activeTab, setActiveTab] = useState<ProjectTab>('all');
  const [companyFilter, setCompanyFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');

  const divisionProjects = useMemo(() => allProjects.filter(p => p.division_id === activeDivision), [allProjects, activeDivision]);

  // Generate month options from project dates
  const monthOptions = useMemo(() => {
    const months = new Set<string>();
    divisionProjects.forEach(p => {
      if (p.start_date) months.add(format(parseISO(p.start_date), 'yyyy-MM'));
      if (p.end_date) months.add(format(parseISO(p.end_date), 'yyyy-MM'));
    });
    return Array.from(months).sort().reverse().map(m => ({
      value: m,
      label: format(parseISO(`${m}-01`), 'MMMM yyyy'),
    }));
  }, [divisionProjects]);

  const companyOptions = useMemo(() => {
    const ids = new Set(divisionProjects.map(p => p.company_id));
    return companies.filter(c => ids.has(c.id)).map(c => ({ value: c.id, label: c.name }));
  }, [divisionProjects, companies]);

  const filteredProjects = useMemo(() => {
    let result = divisionProjects;

    // Tab filter
    if (activeTab === 'all') result = result.filter(p => p.status !== 'completed' && p.status !== 'archived');
    else if (activeTab === 'completed') result = result.filter(p => p.status === 'completed');
    else result = result.filter(p => p.status === 'archived');

    // Company filter
    if (companyFilter) result = result.filter(p => p.company_id === companyFilter);

    // Month filter - project overlaps with selected month
    if (monthFilter) {
      const monthStart = startOfMonth(parseISO(`${monthFilter}-01`));
      const monthEnd = endOfMonth(monthStart);
      result = result.filter(p => {
        const pStart = p.start_date ? parseISO(p.start_date) : null;
        const pEnd = p.end_date ? parseISO(p.end_date) : null;
        if (pStart && pEnd) return pStart <= monthEnd && pEnd >= monthStart;
        if (pStart) return pStart <= monthEnd && pStart >= monthStart;
        if (pEnd) return pEnd <= monthEnd && pEnd >= monthStart;
        return true;
      });
    }

    return result;
  }, [divisionProjects, activeTab, companyFilter, monthFilter]);

  const projectsWithTasks = filteredProjects.map(p => ({
    ...p,
    tasks: allTasks.filter(t => t.project_id === p.id),
  }));

  if (!user) return null;

  const handleCreate = () => {
    setSelectedProject(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleCardClick = (project: any) => {
    setSelectedProject(project);
    setModalMode('view');
    setModalOpen(true);
  };

  const tabs: { key: ProjectTab; label: string }[] = [
    { key: 'all', label: 'All Projects' },
    { key: 'completed', label: 'Completed' },
    { key: 'archived', label: 'Archived' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-2 lg:px-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">{filteredProjects.length} projects found</p>
        </div>
        {isAdmin && (
          <button onClick={handleCreate} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        )}
      </motion.div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg font-medium transition-colors border',
                activeTab === tab.key
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-secondary/50 text-muted-foreground border-border hover:text-foreground hover:border-primary/30'
              )}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <FilterDropdown
            options={companyOptions}
            value={companyFilter}
            onChange={setCompanyFilter}
            placeholder="Filter by company"
            allLabel="All Companies"
          />
          <FilterDropdown
            options={monthOptions}
            value={monthFilter}
            onChange={setMonthFilter}
            placeholder="Filter by month"
            allLabel="All Months"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projectsWithTasks.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project as any}
            companyName={companies.find(c => c.id === project.company_id)?.name || ''}
            index={i}
            onClick={() => handleCardClick(project)}
            onNavigate={() => navigate(`/tasks?project=${project.id}`)}
            showArchiveCheckbox={(activeTab === 'completed' || activeTab === 'archived') && isAdmin}
            isArchived={activeTab === 'archived'}
            onArchiveToggle={() => {
              if (activeTab === 'archived') {
                updateProjectMutation.mutate({ id: project.id, status: 'completed' });
              } else {
                updateProjectMutation.mutate({ id: project.id, status: 'archived' });
              }
            }}
            isAdmin={isAdmin}
            onStatusChange={(status) => updateProjectMutation.mutate({ id: project.id, status })}
          />
        ))}
      </div>

      {projectsWithTasks.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">No projects found.</div>
      )}

      <ProjectModal
        project={selectedProject}
        division={activeDivision}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
      />
    </div>
  );
};

export default Projects;

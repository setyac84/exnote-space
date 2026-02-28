import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useTasks, useCompanies, useUpdateProject } from '@/hooks/useSupabaseData';
import ProjectCard from '@/components/ProjectCard';
import ProjectModal from '@/components/ProjectModal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type ProjectTab = 'all' | 'completed' | 'archived';

const Projects = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: allProjects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: companies = [] } = useCompanies();
  const updateProjectMutation = useUpdateProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');
  const [activeTab, setActiveTab] = useState<ProjectTab>('all');

  const divisionProjects = useMemo(() => allProjects.filter(p => p.division === activeDivision), [allProjects, activeDivision]);

  const tabCounts = useMemo(() => ({
    all: divisionProjects.filter(p => p.status !== 'completed' && p.status !== 'archived').length,
    completed: divisionProjects.filter(p => p.status === 'completed').length,
    archived: divisionProjects.filter(p => p.status === 'archived').length,
  }), [divisionProjects]);

  const filteredProjects = useMemo(() => {
    if (activeTab === 'all') return divisionProjects.filter(p => p.status !== 'completed' && p.status !== 'archived');
    if (activeTab === 'completed') return divisionProjects.filter(p => p.status === 'completed');
    return divisionProjects.filter(p => p.status === 'archived');
  }, [divisionProjects, activeTab]);

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
    <div className="max-w-8xl mx-auto">
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

      {/* Tabs */}
      <div className="flex items-center gap-2 mb-5">
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

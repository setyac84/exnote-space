import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects, useTasks, useCompanies } from '@/hooks/useSupabaseData';
import ProjectCard from '@/components/ProjectCard';
import ProjectModal from '@/components/ProjectModal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';

const Projects = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { data: allProjects = [] } = useProjects();
  const { data: allTasks = [] } = useTasks();
  const { data: companies = [] } = useCompanies();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  if (!user) return null;

  const divisionProjects = allProjects.filter(p => p.division === activeDivision);

  // Build projects with tasks for ProjectCard
  const projectsWithTasks = divisionProjects.map(p => ({
    ...p,
    tasks: allTasks.filter(t => t.project_id === p.id),
  }));

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

  return (
    <div className="max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'All projects' : isAdmin ? `All ${activeDivision} division projects` : 'Projects you\'re involved in'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleCreate} className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Project
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {projectsWithTasks.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project as any}
            companyName={companies.find(c => c.id === project.company_id)?.name || ''}
            index={i}
            onClick={() => handleCardClick(project)}
            onNavigate={() => navigate(`/tasks?project=${project.id}`)}
          />
        ))}
      </div>

      {projectsWithTasks.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">No projects in this division yet.</div>
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

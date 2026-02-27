import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProjects as initialProjects, mockCompanies } from '@/data/mock';
import ProjectCard from '@/components/ProjectCard';
import ProjectModal from '@/components/ProjectModal';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Project } from '@/types';

const Projects = () => {
  const { user, activeDivision, isAdmin, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState(initialProjects);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [modalMode, setModalMode] = useState<'view' | 'edit' | 'create'>('view');

  if (!user) return null;

  const divisionProjects = projects.filter(p => p.division === activeDivision);
  const visibleProjects = isAdmin
    ? divisionProjects
    : divisionProjects.filter(p => p.tasks.some(t => t.assignee_id === user.id));

  const handleCreate = () => {
    setSelectedProject(null);
    setModalMode('create');
    setModalOpen(true);
  };

  const handleCardClick = (project: Project) => {
    setSelectedProject(project);
    setModalMode('view');
    setModalOpen(true);
  };

  const handleSave = (data: any) => {
    if (data.id) {
      setProjects(prev => prev.map(p => p.id === data.id ? { ...p, ...data } : p));
    } else {
      const newProject: Project = {
        ...data,
        id: `p${Date.now()}`,
        created_at: new Date().toISOString().split('T')[0],
        tasks: [],
      };
      setProjects(prev => [...prev, newProject]);
    }
  };

  const handleDelete = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  return (
    <div className="max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isSuperAdmin ? 'Semua project' : isAdmin ? `Semua project divisi ${activeDivision}` : 'Project yang melibatkan Anda'}
          </p>
        </div>
        {isAdmin && (
          <button onClick={handleCreate} className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Tambah Project
          </button>
        )}
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {visibleProjects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} onClick={() => handleCardClick(project)} onNavigate={() => navigate(`/tasks?project=${project.id}`)} />
        ))}
      </div>

      {visibleProjects.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">Belum ada project di divisi ini.</div>
      )}

      <ProjectModal project={selectedProject} division={activeDivision} isOpen={modalOpen} onClose={() => setModalOpen(false)}
        onSave={handleSave} onDelete={isAdmin ? handleDelete : undefined} mode={modalMode} />
    </div>
  );
};

export default Projects;

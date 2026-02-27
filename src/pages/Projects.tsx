import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { mockProjects } from '@/data/mock';
import ProjectCard from '@/components/ProjectCard';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const Projects = () => {
  const { user, activeDivision } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;

  const isAdmin = user.role === 'admin';
  const divisionProjects = mockProjects.filter(p => p.division === activeDivision);

  // Members only see projects containing their tasks
  const visibleProjects = isAdmin
    ? divisionProjects
    : divisionProjects.filter(p => p.tasks.some(t => t.assignee_id === user.id));

  return (
    <div className="max-w-5xl">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Projects</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAdmin ? `Semua project divisi ${activeDivision}` : 'Project yang melibatkan Anda'}
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        {visibleProjects.map((project, i) => (
          <ProjectCard
            key={project.id}
            project={project}
            index={i}
            onClick={() => navigate(`/kanban?project=${project.id}`)}
          />
        ))}
      </div>

      {visibleProjects.length === 0 && (
        <div className="text-center py-20 text-muted-foreground text-sm">
          Belum ada project di divisi ini.
        </div>
      )}
    </div>
  );
};

export default Projects;

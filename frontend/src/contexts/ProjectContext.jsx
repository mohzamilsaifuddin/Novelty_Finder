'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';

const ProjectContext = createContext(null);

export function ProjectProvider({ children }) {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProjects = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data } = await api.get('/projects');
      setProjects(data.projects);
      
      // Load active project from localStorage
      const cached = localStorage.getItem('selected_project_id');
      if (cached) {
        const idInt = parseInt(cached);
        if (data.projects.some(p => p.id === idInt)) {
          setSelectedProjectId(idInt);
        } else if (data.projects.length > 0) {
          setSelectedProjectId(data.projects[0].id);
          localStorage.setItem('selected_project_id', data.projects[0].id.toString());
        }
      } else if (data.projects.length > 0) {
        setSelectedProjectId(data.projects[0].id);
        localStorage.setItem('selected_project_id', data.projects[0].id.toString());
      }
    } catch (err) {
      toast.error('Gagal mengambil daftar proyek');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const selectProject = (id) => {
    setSelectedProjectId(id);
    if (id) {
      localStorage.setItem('selected_project_id', id.toString());
    } else {
      localStorage.removeItem('selected_project_id');
    }
  };

  const createProject = async (projectData) => {
    try {
      const { data } = await api.post('/projects', projectData);
      setProjects(prev => [data.project, ...prev]);
      selectProject(data.project.id);
      toast.success('Proyek berhasil dibuat!');
      return data.project;
    } catch (err) {
      toast.error(err.response?.data?.error || 'Gagal membuat proyek');
      throw err;
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId) || null;

  return (
    <ProjectContext.Provider
      value={{
        projects,
        selectedProjectId,
        activeProject,
        loading,
        refetch: fetchProjects,
        selectProject,
        createProject,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export const useProject = () => {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error('useProject must be used inside ProjectProvider');
  return ctx;
};

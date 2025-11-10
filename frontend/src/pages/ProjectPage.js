import React, { useState, useEffect } from 'react';
import projectService from '../services/projectService';

const ProjectPage = () => {
  const [projects, setProjects] = useState([]);
  const [name, setName] = useState('');

  useEffect(() => {
    projectService.getProjects().then((response) => {
      setProjects(response.data);
    });
  }, []);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    try {
      const response = await projectService.createProject(name);
      setProjects([...projects, response.data]);
      setName('');
    } catch (error) {
      console.error('Failed to create project');
    }
  };

  return (
    <div>
      <h2>Projects</h2>
      <form onSubmit={handleCreateProject}>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name"
        />
        <button type="submit">Create</button>
      </form>
      <ul>
        {projects.map((project) => (
          <li key={project.id}>{project.name}</li>
        ))}
      </ul>
    </div>
  );
};

export default ProjectPage;

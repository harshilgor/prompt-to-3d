import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Dashboard.css';

// Mock data for projects (in real app, this would come from backend/database)
interface Project {
  id: string;
  name: string;
  thumbnail: string;
  createdAt: Date;
  updatedAt: Date;
  modelCount: number;
}

const MOCK_PROJECTS: Project[] = [
  {
    id: '1',
    name: 'Geometric Vase',
    thumbnail: '🏺',
    createdAt: new Date('2024-01-15'),
    updatedAt: new Date('2024-01-16'),
    modelCount: 3,
  },
  {
    id: '2',
    name: 'Mechanical Gear',
    thumbnail: '⚙️',
    createdAt: new Date('2024-01-14'),
    updatedAt: new Date('2024-01-14'),
    modelCount: 1,
  },
  {
    id: '3',
    name: 'Abstract Sculpture',
    thumbnail: '🎨',
    createdAt: new Date('2024-01-12'),
    updatedAt: new Date('2024-01-13'),
    modelCount: 5,
  },
];

export function Dashboard() {
  const navigate = useNavigate();
  const [projects] = useState<Project[]>(MOCK_PROJECTS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleNewProject = () => {
    // In a real app, this would create a new project in the backend
    navigate('/workspace');
  };

  const handleOpenProject = (projectId: string) => {
    // In a real app, this would load the project data
    navigate(`/workspace?project=${projectId}`);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-left">
          <Link to="/" className="dashboard-logo">Curvy</Link>
        </div>
        <div className="header-right">
          <div className="user-avatar">J</div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Welcome Section */}
        <section className="welcome-section">
          <div className="welcome-text">
            <h1>Welcome back</h1>
            <p>Continue working on your 3D creations</p>
          </div>
          <button className="new-project-btn" onClick={handleNewProject}>
            <span className="btn-icon">+</span>
            New Project
          </button>
        </section>

        {/* Search & Filter */}
        <section className="search-section">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="view-options">
            <button className="view-btn active">Grid</button>
            <button className="view-btn">List</button>
          </div>
        </section>

        {/* Projects Grid */}
        <section className="projects-section">
          <h2 className="section-title">Recent Projects</h2>
          
          {filteredProjects.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h3>No projects yet</h3>
              <p>Create your first 3D model to get started</p>
              <button className="create-btn" onClick={handleNewProject}>
                Create Project
              </button>
            </div>
          ) : (
            <div className="projects-grid">
              {/* New Project Card */}
              <div className="project-card new-project-card" onClick={handleNewProject}>
                <div className="card-content">
                  <div className="new-project-icon">+</div>
                  <span>New Project</span>
                </div>
              </div>

              {/* Existing Projects */}
              {filteredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="project-card"
                  onClick={() => handleOpenProject(project.id)}
                >
                  <div className="card-thumbnail">
                    <span className="thumbnail-emoji">{project.thumbnail}</span>
                  </div>
                  <div className="card-info">
                    <h3 className="card-title">{project.name}</h3>
                    <div className="card-meta">
                      <span>{project.modelCount} model{project.modelCount !== 1 ? 's' : ''}</span>
                      <span>•</span>
                      <span>{formatDate(project.updatedAt)}</span>
                    </div>
                  </div>
                  <div className="card-actions">
                    <button className="action-btn" onClick={(e) => { e.stopPropagation(); }}>
                      ⋯
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Quick Stats */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-value">{projects.length}</div>
            <div className="stat-label">Projects</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">
              {projects.reduce((sum, p) => sum + p.modelCount, 0)}
            </div>
            <div className="stat-label">Models Created</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">∞</div>
            <div className="stat-label">Possibilities</div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Dashboard;


import { useMemo, useState } from 'react'
import './App.css'
import { useLocalStorage } from './hooks/useLocalStorage'
import { projectsSeed } from './data/projects'
import type { ProjectSummary } from './data/projects'
import { DashboardPage } from './pages/DashboardPage'
import { EditorPage } from './pages/EditorPage'
import { LandingPage } from './pages/LandingPage'
import type { AppView } from './types/navigation'

function App() {
  const [view, setView] = useState<AppView>('landing')
  const [userProjects, setUserProjects] = useLocalStorage<ProjectSummary[]>('editor-user-projects', [])
  const [selectedProjectId, setSelectedProjectId] = useLocalStorage<string | null>('editor-selected-project', null)

  const allProjects = useMemo(() => [...userProjects, ...projectsSeed], [userProjects])

  const selectedProject =
    allProjects.find((item) => item.id === selectedProjectId) ?? allProjects[0]

  function createNewProject(name: string): void {
    const newProject: ProjectSummary = {
      id: `p-user-${Date.now()}`,
      name,
      summary: 'Projeto criado por você.',
      status: 'draft',
      updatedAt: 'Agora',
      durationLabel: '00:00',
      isDemo: false,
    }
    setUserProjects((prev) => [newProject, ...prev])
    setSelectedProjectId(newProject.id)
  }

  function deleteProject(id: string): void {
    setUserProjects((prev) => prev.filter((p) => p.id !== id))
    if (selectedProjectId === id) {
      setSelectedProjectId(null)
    }
    try {
      localStorage.removeItem(`editor-captions-${id}`)
      localStorage.removeItem(`editor-narration-${id}`)
    } catch {
      // ignore
    }
  }

  return (
    <div className="editor-shell app-shell">
      <header className="topbar">
        <div>
          <h1>Editor</h1>
          <p>Editor de vídeo local — legendas, narração por voz e organização de mídia.</p>
        </div>
        <div className="top-actions nav-actions">
          <button type="button" className={view === 'landing' ? 'active-nav' : ''} onClick={() => setView('landing')}>
            Landing
          </button>
          <button
            type="button"
            className={view === 'dashboard' ? 'active-nav' : ''}
            onClick={() => setView('dashboard')}
          >
            Dashboard
          </button>
          <button type="button" className={view === 'editor' ? 'active-nav' : ''} onClick={() => setView('editor')}>
            Editor
          </button>
        </div>
      </header>

      {view === 'landing' && <LandingPage onOpenDashboard={() => setView('dashboard')} onOpenEditor={() => setView('editor')} />}
      {view === 'dashboard' && (
        <DashboardPage
          projects={allProjects}
          selectedProjectId={selectedProjectId ?? allProjects[0]?.id ?? ''}
          onSelectProject={setSelectedProjectId}
          onOpenEditor={() => setView('editor')}
          onCreateProject={createNewProject}
          onDeleteProject={deleteProject}
        />
      )}
      {view === 'editor' && (
        <EditorPage project={selectedProject} onBackToDashboard={() => setView('dashboard')} onBackToLanding={() => setView('landing')} />
      )}
    </div>
  )
}

export default App

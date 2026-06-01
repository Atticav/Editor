import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { projectsSeed } from './data/projects'
import type { ProjectSummary } from './data/projects'
import { DashboardPage } from './pages/DashboardPage'
import { EditorPage } from './pages/EditorPage'
import { LandingPage } from './pages/LandingPage'
import type { AppView } from './types/navigation'

const USER_PROJECTS_STORAGE_KEY = 'editor:user-projects:v1'
const SELECTED_PROJECT_STORAGE_KEY = 'editor:selected-project-id:v1'
const PROJECT_STORAGE_PREFIX = 'editor:project:'

function readStoredUserProjects(): ProjectSummary[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(USER_PROJECTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item) => typeof item?.id === 'string' && !item?.isDemo) as ProjectSummary[]
  } catch {
    return []
  }
}

function readStoredSelectedProjectId(): string | null {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)
}

function App() {
  const [view, setView] = useState<AppView>('landing')
  const [userProjects, setUserProjects] = useState<ProjectSummary[]>(() => readStoredUserProjects())
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(() => readStoredSelectedProjectId())

  const allProjects = useMemo(() => [...userProjects, ...projectsSeed], [userProjects])
  const resolvedSelectedProjectId =
    selectedProjectId && allProjects.some((item) => item.id === selectedProjectId)
      ? selectedProjectId
      : allProjects[0]?.id ?? null

  const selectedProject =
    allProjects.find((item) => item.id === resolvedSelectedProjectId) ?? allProjects[0]

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

  function resetLocalData(): void {
    setUserProjects([])
    setSelectedProjectId(projectsSeed[0]?.id ?? null)
    if (typeof window === 'undefined') return
    window.localStorage.removeItem(USER_PROJECTS_STORAGE_KEY)
    window.localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
    Object.keys(window.localStorage)
      .filter((key) => key.startsWith(PROJECT_STORAGE_PREFIX))
      .forEach((key) => window.localStorage.removeItem(key))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(USER_PROJECTS_STORAGE_KEY, JSON.stringify(userProjects))
  }, [userProjects])

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (resolvedSelectedProjectId) {
      window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, resolvedSelectedProjectId)
      return
    }
    window.localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY)
  }, [resolvedSelectedProjectId])

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
          selectedProjectId={resolvedSelectedProjectId ?? ''}
          onSelectProject={setSelectedProjectId}
          onOpenEditor={() => setView('editor')}
          onCreateProject={createNewProject}
          onResetLocalProjects={resetLocalData}
        />
      )}
      {view === 'editor' && (
        <EditorPage
          key={selectedProject?.id ?? 'editor-default'}
          project={selectedProject}
          onBackToDashboard={() => setView('dashboard')}
          onBackToLanding={() => setView('landing')}
        />
      )}
    </div>
  )
}

export default App

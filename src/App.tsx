import { useState } from 'react'
import './App.css'
import { projectsSeed } from './data/projects'
import { DashboardPage } from './pages/DashboardPage'
import { EditorPage } from './pages/EditorPage'
import { LandingPage } from './pages/LandingPage'
import type { AppView } from './types/navigation'

function App() {
  const [view, setView] = useState<AppView>('landing')
  const [selectedProjectId, setSelectedProjectId] = useState(projectsSeed[0]?.id ?? '')
  const selectedProject = projectsSeed.find((item) => item.id === selectedProjectId) ?? projectsSeed[0]

  return (
    <div className="editor-shell app-shell">
      <header className="topbar">
        <div>
          <h1>Editor</h1>
          <p>MVP local de editor de vídeo com IA, pronto para evolução real.</p>
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
          projects={projectsSeed}
          selectedProjectId={selectedProjectId}
          onSelectProject={setSelectedProjectId}
          onOpenEditor={() => setView('editor')}
        />
      )}
      {view === 'editor' && (
        <EditorPage project={selectedProject} onBackToDashboard={() => setView('dashboard')} onBackToLanding={() => setView('landing')} />
      )}
    </div>
  )
}

export default App

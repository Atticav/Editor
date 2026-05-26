import { useState } from 'react'
import type { ProjectSummary } from '../data/projects'

interface DashboardPageProps {
  projects: ProjectSummary[]
  selectedProjectId: string
  onSelectProject: (id: string) => void
  onOpenEditor: () => void
  onCreateProject: (name: string) => void
}

const statusLabel: Record<ProjectSummary['status'], string> = {
  draft: 'Rascunho',
  processing: 'Processando',
  ready: 'Pronto',
}

export function DashboardPage({ projects, selectedProjectId, onSelectProject, onOpenEditor, onCreateProject }: DashboardPageProps) {
  const [newName, setNewName] = useState('')

  const userProjects = projects.filter((p) => !p.isDemo)
  const demoProjects = projects.filter((p) => p.isDemo)

  function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const name = newName.trim()
    if (name) {
      onCreateProject(name)
      setNewName('')
    }
  }

  return (
    <main className="dashboard">
      <section className="panel dashboard-header">
        <h2>Projetos</h2>
        <p>Selecione um projeto para abrir no editor ou crie um novo.</p>
        <form className="new-project-form" onSubmit={handleCreate}>
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome do novo projeto"
            aria-label="Nome do novo projeto"
          />
          <button type="submit" disabled={!newName.trim()}>
            + Criar projeto
          </button>
        </form>
      </section>

      {userProjects.length > 0 && (
        <section className="project-grid">
          {userProjects.map((project) => (
            <article
              key={project.id}
              className={project.id === selectedProjectId ? 'panel project-card selected' : 'panel project-card'}
            >
              <h3>{project.name}</h3>
              <p>{project.summary}</p>
              <small>
                {statusLabel[project.status]} • {project.durationLabel} • {project.updatedAt}
              </small>
              <div className="top-actions">
                <button type="button" onClick={() => onSelectProject(project.id)}>
                  Selecionar
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    onSelectProject(project.id)
                    onOpenEditor()
                  }}
                >
                  Abrir no editor
                </button>
              </div>
            </article>
          ))}
        </section>
      )}

      <section className="panel demo-section">
        <h3>Projetos de exemplo</h3>
        <p className="demo-notice">
          Estes {demoProjects.length} projetos são exemplos de demonstração — não são dados seus e existem apenas para
          mostrar o fluxo do editor.
        </p>
      </section>

      <section className="project-grid">
        {demoProjects.map((project) => (
          <article
            key={project.id}
            className={project.id === selectedProjectId ? 'panel project-card selected' : 'panel project-card'}
          >
            <div className="project-card-title-row">
              <h3>{project.name}</h3>
              <span className="demo-badge">Demo</span>
            </div>
            <p>{project.summary}</p>
            <small>
              {statusLabel[project.status]} • {project.durationLabel} • {project.updatedAt}
            </small>
            <div className="top-actions">
              <button type="button" onClick={() => onSelectProject(project.id)}>
                Selecionar
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  onSelectProject(project.id)
                  onOpenEditor()
                }}
              >
                Abrir no editor
              </button>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

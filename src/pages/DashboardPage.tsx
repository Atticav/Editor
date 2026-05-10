import type { ProjectSummary } from '../data/projects'

interface DashboardPageProps {
  projects: ProjectSummary[]
  selectedProjectId: string
  onSelectProject: (id: string) => void
  onOpenEditor: () => void
}

const statusLabel: Record<ProjectSummary['status'], string> = {
  draft: 'Rascunho',
  processing: 'Processando',
  ready: 'Pronto',
}

export function DashboardPage({ projects, selectedProjectId, onSelectProject, onOpenEditor }: DashboardPageProps) {
  return (
    <main className="dashboard">
      <section className="panel dashboard-header">
        <h2>Projetos</h2>
        <p>Escolha um projeto para abrir no editor. Esta tela simula o fluxo SaaS de gestão de vídeos.</p>
      </section>

      <section className="project-grid">
        {projects.map((project) => (
          <article key={project.id} className={project.id === selectedProjectId ? 'panel project-card selected' : 'panel project-card'}>
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
    </main>
  )
}

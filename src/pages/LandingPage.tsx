interface LandingPageProps {
  onOpenDashboard: () => void
  onOpenEditor: () => void
}

const highlights = [
  'Upload local de mídia com preview imediato',
  'Timeline inicial interativa para organizar clipes',
  'Legendas editáveis diretamente na interface',
  'Narração/TTS com vozes mockadas e arquitetura extensível',
]

export function LandingPage({ onOpenDashboard, onOpenEditor }: LandingPageProps) {
  return (
    <main className="landing">
      <section className="panel hero">
        <h2>Editor de vídeo com IA para transformar ideia em produto real</h2>
        <p>
          Primeira versão funcional para desenvolvimento local: landing, dashboard de projetos e editor com preview,
          timeline, legendas e narração/TTS.
        </p>
        <div className="top-actions">
          <button type="button" onClick={onOpenDashboard}>
            Ver projetos
          </button>
          <button type="button" className="secondary" onClick={onOpenEditor}>
            Abrir editor demo
          </button>
        </div>
      </section>

      <section className="panel feature-grid" aria-label="Recursos iniciais">
        {highlights.map((item) => (
          <article key={item}>
            <h3>{item}</h3>
            <p>Módulo pronto para evolução com integrações de IA e jobs assíncronos.</p>
          </article>
        ))}
      </section>
    </main>
  )
}

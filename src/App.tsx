import { useMemo, useRef, useState } from 'react'
import './App.css'
import { requestJob, voiceCatalog } from './core/ai/stubs'
import type { JobStatus } from './core/ai/contracts'
import {
  initialCaptions,
  initialJobs,
  initialMedia,
  type CaptionItem,
  type MediaItem,
} from './data/mockData'

const integrationRoadmap = [
  {
    title: 'Imagem → Vídeo',
    description: 'Stub de job pronto para integrar provider externo com filas assíncronas.',
  },
  {
    title: 'Texto → Vídeo',
    description: 'Interface pronta para prompt, storyboard e montagem por cenas.',
  },
  {
    title: 'Transcrição automática',
    description: 'Ponto de integração planejado para Whisper/API equivalente.',
  },
  {
    title: 'Render/Export',
    description: 'Camada de job preparada para pipeline com FFmpeg/worker.',
  },
]

function App() {
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>(initialMedia)
  const [captions, setCaptions] = useState<CaptionItem[]>(initialCaptions)
  const [jobs, setJobs] = useState<JobStatus[]>(initialJobs)
  const [selectedMediaId, setSelectedMediaId] = useState<string>(initialMedia[0]?.id ?? '')
  const [captionDraft, setCaptionDraft] = useState({ start: '00:00', end: '00:04', text: '' })
  const [narrationText, setNarrationText] = useState('Este tutorial foi criado no Editor.')
  const [selectedVoice, setSelectedVoice] = useState(voiceCatalog[0]?.id ?? '')
  const localUrls = useRef<string[]>([])

  const selectedMedia = useMemo(
    () => mediaLibrary.find((item) => item.id === selectedMediaId) ?? mediaLibrary[0],
    [mediaLibrary, selectedMediaId],
  )

  function handleUpload(files: FileList | null): void {
    if (!files || files.length === 0) return

    const uploadedItems = Array.from(files).map((file, index) => {
      const objectUrl = URL.createObjectURL(file)
      localUrls.current.push(objectUrl)

      const kind: MediaItem['kind'] = file.type.startsWith('video')
        ? 'video'
        : file.type.startsWith('audio')
          ? 'audio'
          : 'image'

      return {
        id: `local-${Date.now()}-${index}`,
        name: file.name,
        kind,
        source: 'local' as const,
        durationLabel: 'Local',
        url: objectUrl,
      }
    })

    setMediaLibrary((current) => [...uploadedItems, ...current])
    setSelectedMediaId(uploadedItems[0].id)
  }

  function addCaption(): void {
    if (!captionDraft.text.trim()) return

    setCaptions((current) => [
      ...current,
      {
        id: `caption-${Date.now()}`,
        start: captionDraft.start,
        end: captionDraft.end,
        text: captionDraft.text.trim(),
      },
    ])

    setCaptionDraft((draft) => ({ ...draft, text: '' }))
  }

  function updateCaption(id: string, text: string): void {
    setCaptions((current) => current.map((item) => (item.id === id ? { ...item, text } : item)))
  }

  function enqueueTtsNarration(): void {
    if (!narrationText.trim()) return

    const job = requestJob('tts-narration', {
      text: narrationText,
      voiceId: selectedVoice,
    })

    setJobs((current) => [job, ...current])
  }

  function requestPipeline(type: 'image-to-video' | 'text-to-video' | 'render-export'): void {
    const job = requestJob(type, { source: selectedMedia?.name ?? 'sem-mídia' })
    setJobs((current) => [job, ...current])
  }

  return (
    <div className="editor-shell">
      <header className="topbar">
        <div>
          <h1>Editor</h1>
          <p>Base inicial de editor de vídeo com IA, pronta para evoluir com integrações reais.</p>
        </div>
        <div className="top-actions">
          <button type="button" onClick={() => requestPipeline('render-export')}>
            Exportar (stub)
          </button>
          <button type="button" className="secondary" onClick={() => requestPipeline('text-to-video')}>
            Texto → Vídeo (stub)
          </button>
        </div>
      </header>

      <main className="layout">
        <section className="panel media-panel">
          <div className="panel-title-row">
            <h2>Biblioteca de mídia</h2>
            <label className="upload-btn">
              Upload
              <input type="file" multiple accept="video/*,image/*,audio/*" onChange={(e) => handleUpload(e.target.files)} />
            </label>
          </div>
          <ul>
            {mediaLibrary.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={item.id === selectedMedia?.id ? 'media-item active' : 'media-item'}
                  onClick={() => setSelectedMediaId(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {item.kind} • {item.durationLabel} • {item.source}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel preview-panel">
          <h2>Preview</h2>
          <div className="preview-frame">
            {!selectedMedia && <p>Envie um arquivo para começar.</p>}
            {selectedMedia?.kind === 'video' && selectedMedia.url && (
              <video controls src={selectedMedia.url} className="preview-media" />
            )}
            {selectedMedia?.kind === 'image' && selectedMedia.url && (
              <img src={selectedMedia.url} alt={selectedMedia.name} className="preview-media" />
            )}
            {selectedMedia?.kind === 'audio' && selectedMedia.url && (
              <audio controls src={selectedMedia.url} className="preview-audio" />
            )}
            {selectedMedia && !selectedMedia.url && (
              <p>
                <strong>{selectedMedia.name}</strong>
                <br />
                Item mockado para demonstração. Faça upload local para pré-visualização real.
              </p>
            )}
          </div>

          <div className="timeline">
            <h3>Timeline (placeholder funcional)</h3>
            <div className="track">
              {mediaLibrary.map((item) => (
                <span key={item.id} className="clip" title={item.name}>
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </section>

        <aside className="panel side-panel">
          <section>
            <h2>Legendas</h2>
            <div className="caption-form">
              <input
                value={captionDraft.start}
                onChange={(e) => setCaptionDraft((draft) => ({ ...draft, start: e.target.value }))}
                aria-label="Início"
                placeholder="Início"
              />
              <input
                value={captionDraft.end}
                onChange={(e) => setCaptionDraft((draft) => ({ ...draft, end: e.target.value }))}
                aria-label="Fim"
                placeholder="Fim"
              />
              <input
                value={captionDraft.text}
                onChange={(e) => setCaptionDraft((draft) => ({ ...draft, text: e.target.value }))}
                aria-label="Texto da legenda"
                placeholder="Texto da legenda"
              />
              <button type="button" onClick={addCaption}>
                Adicionar legenda
              </button>
            </div>
            <ul className="caption-list">
              {captions.map((item) => (
                <li key={item.id}>
                  <span>
                    {item.start} - {item.end}
                  </span>
                  <input value={item.text} onChange={(e) => updateCaption(item.id, e.target.value)} />
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2>Narração / TTS</h2>
            <select value={selectedVoice} onChange={(e) => setSelectedVoice(e.target.value)}>
              {voiceCatalog.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.label} • {voice.locale} • {voice.style}
                </option>
              ))}
            </select>
            <textarea
              value={narrationText}
              onChange={(e) => setNarrationText(e.target.value)}
              rows={4}
              placeholder="Texto da narração"
            />
            <button type="button" onClick={enqueueTtsNarration}>
              Gerar narração (stub)
            </button>
          </section>

          <section>
            <h2>IA e Jobs</h2>
            <div className="roadmap-grid">
              {integrationRoadmap.map((item) => (
                <article key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
            <button type="button" className="secondary" onClick={() => requestPipeline('image-to-video')}>
              Imagem → Vídeo (stub)
            </button>
            <ul className="job-list">
              {jobs.map((job) => (
                <li key={job.id}>
                  <strong>{job.type}</strong>
                  <span>{job.status}</span>
                  <p>{job.note}</p>
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </main>
    </div>
  )
}

export default App

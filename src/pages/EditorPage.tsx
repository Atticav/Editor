import { useEffect, useMemo, useRef, useState } from 'react'
import type { JobStatus, VoiceEmotion, VoiceOption } from '../core/ai/contracts'
import { requestJob, voiceCatalog } from '../core/ai/stubs'
import {
  initialCaptions,
  initialJobs,
  initialMedia,
  type CaptionItem,
  type MediaItem,
} from '../data/mockData'
import type { ProjectSummary } from '../data/projects'

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

interface EditorPageProps {
  project?: ProjectSummary
  onBackToDashboard: () => void
  onBackToLanding: () => void
}

export function EditorPage({ project, onBackToDashboard, onBackToLanding }: EditorPageProps) {
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>(initialMedia)
  const [captions, setCaptions] = useState<CaptionItem[]>(initialCaptions)
  const [jobs, setJobs] = useState<JobStatus[]>(initialJobs)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(initialMedia[0]?.id ?? null)
  const [captionDraft, setCaptionDraft] = useState({ start: '00:00', end: '00:04', text: '' })
  const [narrationText, setNarrationText] = useState('Este tutorial foi criado no Editor.')
  const [selectedVoice, setSelectedVoice] = useState(voiceCatalog[0]?.id ?? '')
  const [selectedEmotion, setSelectedEmotion] = useState<VoiceEmotion>('neutro')
  const [voiceFilterLang, setVoiceFilterLang] = useState<string>('all')
  const [voiceFilterGender, setVoiceFilterGender] = useState<string>('all')
  const localUrls = useRef<string[]>([])

  const selectedMedia = useMemo(() => {
    if (mediaLibrary.length === 0) return undefined
    if (!selectedMediaId) return mediaLibrary[0]
    return mediaLibrary.find((item) => item.id === selectedMediaId) ?? mediaLibrary[0]
  }, [mediaLibrary, selectedMediaId])

  const filteredVoices = useMemo<VoiceOption[]>(() => {
    return voiceCatalog.filter((v) => {
      const langMatch = voiceFilterLang === 'all' || v.language === voiceFilterLang
      const genderMatch = voiceFilterGender === 'all' || v.gender === voiceFilterGender
      return langMatch && genderMatch
    })
  }, [voiceFilterLang, voiceFilterGender])

  const currentVoice = useMemo<VoiceOption | undefined>(
    () => voiceCatalog.find((v) => v.id === selectedVoice),
    [selectedVoice],
  )

  const availableEmotions = useMemo<VoiceEmotion[]>(() => {
    return currentVoice?.emotions ?? ['neutro']
  }, [currentVoice])

  useEffect(() => {
    const urls = localUrls.current

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

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
      emotion: selectedEmotion,
    })

    setJobs((current) => [job, ...current])
  }

  function requestPipeline(type: 'image-to-video' | 'text-to-video' | 'render-export'): void {
    const job = requestJob(type, { sourceMediaName: selectedMedia?.name ?? 'sem-mídia' })
    setJobs((current) => [job, ...current])
  }

  return (
    <main className="editor-page">
      <section className="panel dashboard-header">
        <h2>{project ? `Editor • ${project.name}` : 'Editor'}</h2>
        <p>Fluxo local funcional com upload, preview, timeline interativa, legendas e narração/TTS.</p>
        <div className="top-actions">
          <button type="button" className="secondary" onClick={onBackToLanding}>
            Voltar para landing
          </button>
          <button type="button" onClick={onBackToDashboard}>
            Voltar para dashboard
          </button>
          <button type="button" onClick={() => requestPipeline('render-export')}>
            Exportar (stub)
          </button>
          <button type="button" className="secondary" onClick={() => requestPipeline('text-to-video')}>
            Texto → Vídeo (stub)
          </button>
        </div>
      </section>

      <section className="layout">
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
          <h2>Preview / Player</h2>
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
            <h3>Timeline (placeholder funcional e interativo)</h3>
            <div className="track">
              {mediaLibrary.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className={item.id === selectedMedia?.id ? 'clip active' : 'clip'}
                  title={item.name}
                  onClick={() => setSelectedMediaId(item.id)}
                >
                  {item.name}
                </button>
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

            <div className="voice-filters">
              <select
                value={voiceFilterLang}
                onChange={(e) => {
                  setVoiceFilterLang(e.target.value)
                  setSelectedVoice(
                    voiceCatalog.find((v) => {
                      const langMatch = e.target.value === 'all' || v.language === e.target.value
                      const genderMatch = voiceFilterGender === 'all' || v.gender === voiceFilterGender
                      return langMatch && genderMatch
                    })?.id ?? voiceCatalog[0]?.id ?? '',
                  )
                }}
                aria-label="Filtrar por idioma"
              >
                <option value="all">Todos os idiomas</option>
                <option value="pt-BR">Português (BR)</option>
                <option value="en-US">Inglês (EUA)</option>
                <option value="en-GB">Inglês (Reino Unido)</option>
                <option value="en-AU">Inglês (Austrália)</option>
                <option value="en-IN">Inglês (Índia)</option>
              </select>

              <select
                value={voiceFilterGender}
                onChange={(e) => {
                  setVoiceFilterGender(e.target.value)
                  setSelectedVoice(
                    voiceCatalog.find((v) => {
                      const langMatch = voiceFilterLang === 'all' || v.language === voiceFilterLang
                      const genderMatch = e.target.value === 'all' || v.gender === e.target.value
                      return langMatch && genderMatch
                    })?.id ?? voiceCatalog[0]?.id ?? '',
                  )
                }}
                aria-label="Filtrar por gênero"
              >
                <option value="all">Todos os gêneros</option>
                <option value="feminino">Feminino</option>
                <option value="masculino">Masculino</option>
                <option value="neutro">Neutro</option>
              </select>
            </div>

            <select
              value={selectedVoice}
              onChange={(e) => {
                setSelectedVoice(e.target.value)
                setSelectedEmotion('neutro')
              }}
              aria-label="Selecionar voz"
              size={5}
              className="voice-list"
            >
              {filteredVoices.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.label} — {voice.style} [{voice.ageGroup}]
                </option>
              ))}
            </select>

            {currentVoice && (
              <div className="voice-detail">
                <div className="voice-detail-header">
                  <span className="voice-badge">{currentVoice.language}</span>
                  <span className="voice-badge">{currentVoice.gender}</span>
                  <span className="voice-badge">{currentVoice.ageGroup}</span>
                  {currentVoice.accent && <span className="voice-badge">{currentVoice.accent}</span>}
                </div>
                <p className="voice-description">{currentVoice.description}</p>
                <div className="voice-use-cases">
                  {currentVoice.useCases.map((uc) => (
                    <span key={uc} className="voice-tag">
                      {uc}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <label className="voice-field-label" htmlFor="emotion-select">
              Emoção
            </label>
            <select
              id="emotion-select"
              value={selectedEmotion}
              onChange={(e) => setSelectedEmotion(e.target.value as VoiceEmotion)}
              aria-label="Selecionar emoção"
            >
              {availableEmotions.map((emotion) => (
                <option key={emotion} value={emotion}>
                  {emotion}
                </option>
              ))}
            </select>

            <label className="voice-field-label" htmlFor="narration-textarea">
              Texto da narração
            </label>
            <textarea
              id="narration-textarea"
              value={narrationText}
              onChange={(e) => setNarrationText(e.target.value)}
              rows={8}
              placeholder="Digite ou cole o roteiro de narração aqui. Use parágrafos para separar blocos de texto. O texto será processado pela voz e emoção selecionadas."
              className="narration-textarea"
            />
            <div className="narration-meta">
              <span>{narrationText.trim().split(/\s+/).filter(Boolean).length} palavras</span>
              <span>{narrationText.length} caracteres</span>
            </div>
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
      </section>
    </main>
  )
}

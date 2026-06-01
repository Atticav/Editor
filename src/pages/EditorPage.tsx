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

type EditorTab = 'captions' | 'narration' | 'jobs'

interface PersistedEditorState {
  captions: CaptionItem[]
  narrationText: string
  activeTab: EditorTab
}

const PROJECT_EDITOR_STORAGE_PREFIX = 'editor:project:'
const defaultCaptionDraft = { start: '00:00', end: '00:04', text: '' }
const defaultNarrationText = 'Este tutorial foi criado no Editor.'

function createLocalId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`
  }
  const timer = typeof performance !== 'undefined' ? performance.now().toFixed(5) : '0'
  return `${prefix}-${Date.now()}-${timer}-${Math.round(Math.random() * 1_000_000)}`
}

const integrationRoadmap = [
  {
    title: 'Imagem → Vídeo',
    description: 'Requer provider externo (RunwayML, Kling, etc.). Ponto de integração preparado.',
  },
  {
    title: 'Texto → Vídeo',
    description: 'Interface pronta para prompt e storyboard. Requer provider de geração de vídeo.',
  },
  {
    title: 'Transcrição automática',
    description: 'Integração planejada para Whisper/API equivalente.',
  },
  {
    title: 'Render/Export',
    description: 'Requer pipeline com FFmpeg ou serviço equivalente de render.',
  },
]

function parseTimeToSeconds(t: string): number {
  const parts = t.split(':').map(Number)
  if (parts.length === 3) {
    // HH:MM:SS
    return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
  }
  // MM:SS
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

function getProjectEditorStorageKey(projectId?: string): string | null {
  if (!projectId) return null
  return `${PROJECT_EDITOR_STORAGE_PREFIX}${projectId}:editor-state:v1`
}

function readPersistedEditorState(projectId?: string): PersistedEditorState | null {
  if (typeof window === 'undefined') return null
  const key = getProjectEditorStorageKey(projectId)
  if (!key) return null

  try {
    const raw = window.localStorage.getItem(key)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return null
    if (!Array.isArray(parsed.captions) || typeof parsed.narrationText !== 'string') return null
    const activeTab: EditorTab =
      parsed.activeTab === 'captions' || parsed.activeTab === 'narration' || parsed.activeTab === 'jobs'
        ? parsed.activeTab
        : 'captions'
    return {
      captions: parsed.captions.filter(
        (item: CaptionItem) =>
          typeof item?.id === 'string' &&
          typeof item?.start === 'string' &&
          typeof item?.end === 'string' &&
          typeof item?.text === 'string',
      ),
      narrationText: parsed.narrationText,
      activeTab,
    }
  } catch {
    return null
  }
}

interface EditorPageProps {
  project?: ProjectSummary
  onBackToDashboard: () => void
  onBackToLanding: () => void
}

export function EditorPage({ project, onBackToDashboard, onBackToLanding }: EditorPageProps) {
  const initialPersistedState = readPersistedEditorState(project?.id)
  const [activeTab, setActiveTab] = useState<EditorTab>(initialPersistedState?.activeTab ?? 'captions')
  const [mediaLibrary, setMediaLibrary] = useState<MediaItem[]>(initialMedia)
  const [captions, setCaptions] = useState<CaptionItem[]>(initialPersistedState?.captions ?? initialCaptions)
  const [jobs, setJobs] = useState<JobStatus[]>(initialJobs)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(initialMedia[0]?.id ?? null)
  const [captionDraft, setCaptionDraft] = useState(defaultCaptionDraft)
  const [narrationText, setNarrationText] = useState(initialPersistedState?.narrationText ?? defaultNarrationText)
  const [selectedVoice, setSelectedVoice] = useState(voiceCatalog[0]?.id ?? '')
  const [selectedEmotion, setSelectedEmotion] = useState<VoiceEmotion>('neutro')
  const [voiceFilterLang, setVoiceFilterLang] = useState<string>('all')
  const [voiceFilterGender, setVoiceFilterGender] = useState<string>('all')
  const [currentTime, setCurrentTime] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [systemVoices, setSystemVoices] = useState<SpeechSynthesisVoice[]>([])
  const [narrationNotice, setNarrationNotice] = useState<string | null>(null)
  const localUrls = useRef<string[]>([])
  const videoRef = useRef<HTMLVideoElement>(null)
  const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

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

  // Determine which caption to show as overlay on the preview
  const activeCaptionForOverlay = useMemo<CaptionItem | null>(() => {
    if (!captions.length) return null
    // No overlay for audio-only content
    if (selectedMedia?.kind === 'audio') return null
    // For real video: sync with currentTime
    if (selectedMedia?.kind === 'video' && selectedMedia.url) {
      return (
        captions.find((c) => {
          const start = parseTimeToSeconds(c.start)
          const end = parseTimeToSeconds(c.end)
          return currentTime >= start && currentTime < end
        }) ?? null
      )
    }
    // For images or mock/no-url media: show first caption as static preview
    return captions[0]
  }, [captions, selectedMedia, currentTime])

  const activeCaptionId = useMemo<string | null>(() => {
    if (selectedMedia?.kind !== 'video' || !selectedMedia.url) return null
    return (
      captions.find((c) => {
        const start = parseTimeToSeconds(c.start)
        const end = parseTimeToSeconds(c.end)
        return currentTime >= start && currentTime < end
      })?.id ?? null
    )
  }, [captions, selectedMedia, currentTime])

  useEffect(() => {
    const urls = localUrls.current
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  useEffect(() => {
    if (!speechSupported) return
    const synth = window.speechSynthesis
    const updateVoices = () => {
      const availableVoices = synth.getVoices()
      setSystemVoices(availableVoices)
    }
    updateVoices()
    synth.addEventListener('voiceschanged', updateVoices)
    return () => synth.removeEventListener('voiceschanged', updateVoices)
  }, [speechSupported])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const key = getProjectEditorStorageKey(project?.id)
    if (!key) return
    const payload: PersistedEditorState = {
      captions,
      narrationText,
      activeTab,
    }
    window.localStorage.setItem(key, JSON.stringify(payload))
  }, [project?.id, captions, narrationText, activeTab])

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
        id: createLocalId(`local-${index}`),
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
        id: createLocalId('caption'),
        start: captionDraft.start,
        end: captionDraft.end,
        text: captionDraft.text.trim(),
      },
    ])

    setCaptionDraft((draft) => ({ ...draft, text: '' }))
  }

  function duplicateCaption(id: string): void {
    setCaptions((current) => {
      const target = current.find((item) => item.id === id)
      if (!target) return current
      return [
        ...current,
        {
          ...target,
          id: createLocalId('caption'),
        },
      ]
    })
  }

  function updateCaption(id: string, text: string): void {
    setCaptions((current) => current.map((item) => (item.id === id ? { ...item, text } : item)))
  }

  function deleteCaption(id: string): void {
    setCaptions((current) => current.filter((item) => item.id !== id))
  }

  function clearCaptions(): void {
    setCaptions([])
  }

  function clearJobs(): void {
    setJobs([])
  }

  function speakNarration(): void {
    if (!narrationText.trim()) return

    if (speechSupported) {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(narrationText)

      const voiceOption = voiceCatalog.find((v) => v.id === selectedVoice)
      let selectedVoiceLabel = 'voz padrão do navegador'
      let selectedVoiceNote = 'Narração local reproduzida com sucesso.'
      if (voiceOption) {
        const voices = systemVoices.length ? systemVoices : window.speechSynthesis.getVoices()
        const localeLang = voiceOption.locale.split('-')[0]
        const matched =
          voices.find((v) => v.lang === voiceOption.locale) ??
          (localeLang ? voices.find((v) => v.lang.startsWith(localeLang)) : undefined)
        if (matched) {
          utterance.voice = matched
          selectedVoiceLabel = `${matched.name} (${matched.lang})`
          if (matched.lang !== voiceOption.locale) {
            selectedVoiceNote = `Voz exata "${voiceOption.label}" não encontrada. Usando ${selectedVoiceLabel}.`
          }
        } else if (voices.length > 0) {
          const fallbackVoice = voices[0]
          utterance.voice = fallbackVoice
          selectedVoiceLabel = `${fallbackVoice.name} (${fallbackVoice.lang})`
          selectedVoiceNote = `Não há voz compatível com ${voiceOption.locale} instalada. Usando ${selectedVoiceLabel}.`
        } else {
          selectedVoiceNote =
            'O navegador não listou vozes instaladas. Tente novamente ou instale vozes no sistema para maior controle.'
        }
        utterance.lang = voiceOption.locale
      }

      utterance.onstart = () => {
        setIsSpeaking(true)
        setNarrationNotice(selectedVoiceNote)
      }
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => {
        setIsSpeaking(false)
        setNarrationNotice('Não foi possível reproduzir a narração agora. Verifique permissões e vozes do navegador.')
      }

      window.speechSynthesis.speak(utterance)

      const maxPreviewLength = 60
      const preview = narrationText.length > maxPreviewLength ? narrationText.slice(0, maxPreviewLength) + '…' : narrationText
      const job = requestJob('tts-narration', {
        text: preview,
        voiceId: selectedVoice,
        emotion: selectedEmotion,
        engine: 'Web Speech API (local)',
      })
      setJobs((current) => [{ ...job, status: 'done', note: `Reproduzido localmente com ${selectedVoiceLabel}.` }, ...current])
    } else {
      // Web Speech API unavailable — register a stub job for visibility
      setNarrationNotice(
        'Este navegador não oferece Web Speech API para reprodução local. Você ainda pode salvar o texto e testar em um navegador compatível.',
      )
      const job = requestJob('tts-narration', {
        text: narrationText,
        voiceId: selectedVoice,
        emotion: selectedEmotion,
      })
      setJobs((current) => [job, ...current])
    }
  }

  function stopNarration(): void {
    if (speechSupported) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }

  function requestPipeline(type: 'image-to-video' | 'text-to-video' | 'render-export'): void {
    const job = requestJob(type, { sourceMediaName: selectedMedia?.name ?? 'sem-mídia' })
    setJobs((current) => [job, ...current])
  }

  return (
    <main className="editor-page">
      <section className="panel dashboard-header">
        <h2>{project ? `Editor • ${project.name}` : 'Editor'}</h2>
        <p>
          {project?.isDemo
            ? 'Projeto de demonstração — faça upload de mídia, edite legendas e use a narração por voz local.'
            : 'Faça upload de mídia, edite legendas e use a narração por voz do navegador.'}{' '}
          Legendas e texto da narração são salvos localmente por projeto.
        </p>
        <div className="top-actions">
          <button type="button" className="secondary" onClick={onBackToLanding}>
            Voltar para landing
          </button>
          <button type="button" onClick={onBackToDashboard}>
            Voltar para dashboard
          </button>
          <button
            type="button"
            className="secondary"
            title="Exportar requer integração com backend/FFmpeg — não disponível nesta versão"
            onClick={() => requestPipeline('render-export')}
          >
            Exportar ↗
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
          <p className="mock-notice">Arquivos locais enviados não podem ser restaurados após recarregar a página.</p>
          {mediaLibrary.some((item) => item.source === 'mock') && (
            <p className="mock-notice">Itens com 📦 são de demonstração — faça upload para reprodução real.</p>
          )}
          <ul>
            {mediaLibrary.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={[
                    'media-item',
                    item.id === selectedMedia?.id ? 'active' : '',
                    item.source === 'mock' ? 'mock' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => setSelectedMediaId(item.id)}
                >
                  <strong>{item.name}</strong>
                  <span>
                    {item.kind} • {item.durationLabel} • {item.source === 'mock' ? '📦 demo' : '✅ local'}
                  </span>
                </button>
              </li>
            ))}
            {mediaLibrary.length === 0 && <li className="list-empty">Nenhuma mídia carregada. Faça upload para começar.</li>}
          </ul>
        </section>

        <section className="panel preview-panel">
          <h2>Preview / Player</h2>
          <p className="active-media-note">
            {selectedMedia
              ? `Mídia ativa: ${selectedMedia.name} (${selectedMedia.kind}, ${selectedMedia.source === 'mock' ? 'demo' : 'local'})`
              : 'Nenhuma mídia selecionada'}
          </p>
          <div className="preview-frame">
            {!selectedMedia && <p>Envie um arquivo para começar.</p>}
            {selectedMedia?.kind === 'video' && selectedMedia.url && (
              <video
                ref={videoRef}
                controls
                src={selectedMedia.url}
                className="preview-media"
                onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
              />
            )}
            {selectedMedia?.kind === 'image' && selectedMedia.url && (
              <img src={selectedMedia.url} alt={selectedMedia.name} className="preview-media" />
            )}
            {selectedMedia?.kind === 'audio' && selectedMedia.url && (
              <audio controls src={selectedMedia.url} className="preview-audio" />
            )}
            {selectedMedia && !selectedMedia.url && (
              <p className="mock-placeholder">
                <strong>{selectedMedia.name}</strong>
                <br />
                <span>Item de demonstração — faça upload para reproduzir.</span>
              </p>
            )}
            {activeCaptionForOverlay && (
              <div className="caption-overlay">{activeCaptionForOverlay.text}</div>
            )}
          </div>

          <div className="timeline">
            <h3>Timeline</h3>
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
              {mediaLibrary.length === 0 && <p className="list-empty">Timeline vazia.</p>}
            </div>
          </div>
        </section>

        <aside className="panel side-panel">
          <div className="editor-tabs">
            <button
              type="button"
              className={activeTab === 'captions' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('captions')}
            >
              Legendas
            </button>
            <button
              type="button"
              className={activeTab === 'narration' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('narration')}
            >
              Narração
            </button>
            <button
              type="button"
              className={activeTab === 'jobs' ? 'tab-btn active' : 'tab-btn'}
              onClick={() => setActiveTab('jobs')}
            >
              IA / Jobs
            </button>
          </div>

          {activeTab === 'captions' && (
            <section>
              <p className="tab-hint">
                Legendas aparecem sobre o preview. Para vídeo, sincronizam com o tempo de reprodução.
              </p>
              <div className="caption-form">
                <div className="caption-time-row">
                  <input
                    value={captionDraft.start}
                    onChange={(e) => setCaptionDraft((draft) => ({ ...draft, start: e.target.value }))}
                    aria-label="Início"
                    placeholder="Início (00:00)"
                  />
                  <input
                    value={captionDraft.end}
                    onChange={(e) => setCaptionDraft((draft) => ({ ...draft, end: e.target.value }))}
                    aria-label="Fim"
                    placeholder="Fim (00:04)"
                  />
                </div>
                <input
                  value={captionDraft.text}
                  onChange={(e) => setCaptionDraft((draft) => ({ ...draft, text: e.target.value }))}
                  aria-label="Texto da legenda"
                  placeholder="Texto da legenda"
                  onKeyDown={(e) => e.key === 'Enter' && addCaption()}
                />
                <button type="button" onClick={addCaption}>
                  + Adicionar legenda
                </button>
                <button type="button" className="secondary" onClick={clearCaptions} disabled={captions.length === 0}>
                  Limpar legendas
                </button>
              </div>
              <ul className="caption-list">
                {captions.map((item) => (
                  <li
                    key={item.id}
                    className={item.id === activeCaptionId ? 'active-caption' : ''}
                    aria-current={item.id === activeCaptionId ? 'true' : undefined}
                  >
                    <div className="caption-item-header">
                      <span>
                        {item.start} → {item.end}
                      </span>
                      <div className="top-actions">
                        <button
                          type="button"
                          className="caption-action-btn"
                          onClick={() => duplicateCaption(item.id)}
                          aria-label="Duplicar legenda"
                        >
                          Duplicar
                        </button>
                        <button
                          type="button"
                          className="caption-action-btn"
                          onClick={() => deleteCaption(item.id)}
                          aria-label="Remover legenda"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    <input value={item.text} onChange={(e) => updateCaption(item.id, e.target.value)} />
                  </li>
                ))}
                {captions.length === 0 && <li className="list-empty">Nenhuma legenda adicionada.</li>}
              </ul>
            </section>
          )}

          {activeTab === 'narration' && (
            <section>
              <p className="tab-hint">
                {speechSupported
                  ? 'Narração via Web Speech API do navegador — local e gratuita. A voz exata depende das vozes instaladas no sistema.'
                  : 'Seu navegador não suporta Web Speech API. O texto da narração continua salvo localmente para você não perder conteúdo.'}
              </p>
              {speechSupported && systemVoices.length === 0 && (
                <p className="tab-hint">
                  As vozes do sistema ainda não foram carregadas. Se necessário, aguarde alguns segundos ou recarregue.
                </p>
              )}
              {narrationNotice && (
                <p className="speech-notice" aria-live="polite" role="status">
                  {narrationNotice}
                </p>
              )}

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
                rows={6}
                placeholder="Digite o texto para narração..."
                className="narration-textarea"
              />
              <div className="narration-meta">
                <span>{narrationText.trim().split(/\s+/).filter(Boolean).length} palavras</span>
                <span>{narrationText.length} caracteres</span>
              </div>
              <div className="narration-actions">
                <button type="button" disabled={isSpeaking || !narrationText.trim()} onClick={speakNarration}>
                  {isSpeaking ? '🔊 Falando…' : '▶ Falar narração'}
                </button>
                {isSpeaking && (
                  <button type="button" className="secondary" onClick={stopNarration}>
                    ■ Parar
                  </button>
                )}
              </div>
            </section>
          )}

          {activeTab === 'jobs' && (
            <section>
              <p className="tab-hint">
                Pipelines que requerem integração com backend externo. Os botões criam entradas de exemplo — não
                executam de verdade nesta versão.
              </p>
              <button type="button" className="secondary" onClick={clearJobs} disabled={jobs.length === 0}>
                Limpar jobs
              </button>
              <div className="roadmap-grid">
                {integrationRoadmap.map((item) => (
                  <article key={item.title}>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
              <button type="button" className="secondary" onClick={() => requestPipeline('image-to-video')}>
                Imagem → Vídeo (requer integração)
              </button>
              <ul className="job-list">
                {jobs.map((job) => (
                  <li key={job.id}>
                    <strong>{job.type}</strong>
                    <span className={`job-status job-status-${job.status}`}>{job.status}</span>
                    <p>{job.note}</p>
                  </li>
                ))}
                {jobs.length === 0 && <li className="list-empty">Nenhum job registrado.</li>}
              </ul>
            </section>
          )}
        </aside>
      </section>
    </main>
  )
}

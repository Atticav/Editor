import type { JobStatus } from '../core/ai/contracts'

export type MediaKind = 'video' | 'image' | 'audio'

export interface MediaItem {
  id: string
  name: string
  kind: MediaKind
  source: 'mock' | 'local'
  durationLabel: string
  url?: string
}

export interface CaptionItem {
  id: string
  start: string
  end: string
  text: string
}

export const initialMedia: MediaItem[] = [
  {
    id: 'm-001',
    name: 'tutorial-intro.mp4',
    kind: 'video',
    source: 'mock',
    durationLabel: '00:12',
  },
  {
    id: 'm-002',
    name: 'frame-produto.png',
    kind: 'image',
    source: 'mock',
    durationLabel: 'Cena estática',
  },
  {
    id: 'm-003',
    name: 'trilha-destaque.mp3',
    kind: 'audio',
    source: 'mock',
    durationLabel: '00:45',
  },
]

export const initialCaptions: CaptionItem[] = [
  {
    id: 'c-001',
    start: '00:00',
    end: '00:03',
    text: 'Bem-vindo ao Editor: base real para vídeos com IA.',
  },
  {
    id: 'c-002',
    start: '00:03',
    end: '00:07',
    text: 'Faça upload, organize mídia e ajuste legendas com precisão.',
  },
]

export const initialJobs: JobStatus[] = [
  {
    id: 'job-transcription-seed',
    type: 'transcription',
    status: 'queued',
    note: 'Stub pronto para conectar provedor de transcrição automática.',
  },
]

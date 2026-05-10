export type JobType =
  | 'image-to-video'
  | 'text-to-video'
  | 'transcription'
  | 'tts-narration'
  | 'render-export'

export interface JobRequest {
  id: string
  type: JobType
  input: Record<string, string>
  createdAt: string
}

export interface JobStatus {
  id: string
  type: JobType
  status: 'queued' | 'processing' | 'done' | 'failed'
  note: string
}

export type VoiceGender = 'feminino' | 'masculino' | 'neutro'
export type VoiceAgeGroup = 'jovem' | 'adulto' | 'idoso'
export type VoiceEmotion =
  | 'neutro'
  | 'feliz'
  | 'triste'
  | 'ansioso'
  | 'sussurrando'
  | 'medo'
  | 'surpreso'
  | 'suspeitando'
  | 'animado'
  | 'calmo'
  | 'sério'
  | 'dramático'
  | 'irônico'

export type VoiceUseCase =
  | 'tutorial'
  | 'anúncio'
  | 'narrativa'
  | 'institucional'
  | 'dramático'
  | 'entretenimento'
  | 'notícias'
  | 'documentário'
  | 'audiolibro'

export interface VoiceOption {
  id: string
  label: string
  locale: string
  language: 'pt-BR' | 'en-US' | 'en-GB' | 'en-AU' | 'en-IN'
  gender: VoiceGender
  ageGroup: VoiceAgeGroup
  accent?: string
  style: string
  description: string
  emotions: VoiceEmotion[]
  useCases: VoiceUseCase[]
}

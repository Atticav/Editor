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

export interface VoiceOption {
  id: string
  label: string
  locale: string
  style: string
}

import type { JobRequest, JobStatus, VoiceOption } from './contracts'
import { createQueuedJob } from '../jobs/queue'

export const voiceCatalog: VoiceOption[] = [
  { id: 'pt-br-clara', label: 'Clara', locale: 'pt-BR', style: 'Didática natural' },
  { id: 'pt-br-rafael', label: 'Rafael', locale: 'pt-BR', style: 'Narrador técnico' },
  { id: 'en-us-ava', label: 'Ava', locale: 'en-US', style: 'Instrucional amigável' },
]

function createJobId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function requestJob(type: JobRequest['type'], input: JobRequest['input']): JobStatus {
  const request: JobRequest = {
    id: createJobId(type),
    type,
    input,
    createdAt: new Date().toISOString(),
  }

  return createQueuedJob(request)
}

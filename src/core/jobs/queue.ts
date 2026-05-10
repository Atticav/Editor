import type { JobRequest, JobStatus } from '../ai/contracts'

export function createQueuedJob(request: JobRequest): JobStatus {
  return {
    id: request.id,
    type: request.type,
    status: 'queued',
    note: 'Fila local simulada. Substituir por Redis/BullMQ no backend.',
  }
}

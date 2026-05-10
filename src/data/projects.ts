export interface ProjectSummary {
  id: string
  name: string
  summary: string
  status: 'draft' | 'processing' | 'ready'
  updatedAt: string
  durationLabel: string
}

export const projectsSeed: ProjectSummary[] = [
  {
    id: 'p-001',
    name: 'Tutorial de onboarding',
    summary: 'Vídeo guiado para novos usuários do produto.',
    status: 'draft',
    updatedAt: 'Hoje, 14:20',
    durationLabel: '01:12',
  },
  {
    id: 'p-002',
    name: 'Demo de funcionalidade IA',
    summary: 'Cena com narração TTS e legenda sincronizada.',
    status: 'processing',
    updatedAt: 'Ontem, 19:05',
    durationLabel: '00:48',
  },
  {
    id: 'p-003',
    name: 'Anúncio social curto',
    summary: 'Versão vertical para reels/shorts.',
    status: 'ready',
    updatedAt: '08/05, 09:41',
    durationLabel: '00:30',
  },
]

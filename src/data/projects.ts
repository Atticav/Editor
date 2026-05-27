export interface ProjectSummary {
  id: string
  name: string
  summary: string
  status: 'draft' | 'processing' | 'ready'
  updatedAt: string
  durationLabel: string
  isDemo?: boolean
}

export const projectsSeed: ProjectSummary[] = [
  {
    id: 'p-001',
    name: 'Tutorial de onboarding',
    summary: 'Exemplo de projeto — vídeo guiado para novos usuários.',
    status: 'draft',
    updatedAt: 'Hoje, 14:20',
    durationLabel: '01:12',
    isDemo: true,
  },
  {
    id: 'p-002',
    name: 'Demo de funcionalidade IA',
    summary: 'Exemplo de projeto — cena com narração e legenda.',
    status: 'processing',
    updatedAt: 'Ontem, 19:05',
    durationLabel: '00:48',
    isDemo: true,
  },
  {
    id: 'p-003',
    name: 'Anúncio social curto',
    summary: 'Exemplo de projeto — versão vertical para reels/shorts.',
    status: 'ready',
    updatedAt: '08/05, 09:41',
    durationLabel: '00:30',
    isDemo: true,
  },
]

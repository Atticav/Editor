# Editor

Base inicial executável de um **editor de vídeo com IA** focado em evolução realista.

> Este PR não promete geração “ilimitada” nem “perfeitamente realista”.
> A geração pesada de vídeo por IA exige custos de GPU, filas e provedores externos.

## O que já existe neste MVP

- App web em **React + TypeScript + Vite**.
- Navegação inicial em 3 páginas:
  - **Landing page** (apresentação do produto e CTA)
  - **Dashboard de projetos** (cards mockados de projetos)
  - **Editor** (fluxo principal de edição)
- Layout inicial profissional com:
  - **Biblioteca de mídia**
  - **Preview/Player**
  - **Timeline (placeholder funcional)**
  - **Painel lateral** para legendas, narração/TTS e IA/jobs.
- Fluxo de **upload local** de vídeo/imagem/áudio com pré-visualização.
- Mídias **mockadas** para demonstrar o produto mesmo sem upload.
- Módulo de **legendas** com adicionar e editar itens.
- Módulo de **narração/TTS** com catálogo de vozes (stub).
- Arquitetura inicial preparada para integrações futuras de:
  - imagem → vídeo
  - texto → vídeo
  - transcrição automática
  - render/export
  - filas/jobs assíncronos

## Arquitetura inicial

```text
src/
  App.tsx                  # navegação entre landing, dashboard e editor
  pages/
    LandingPage.tsx        # apresentação do produto
    DashboardPage.tsx      # visão inicial de projetos
    EditorPage.tsx         # editor com preview, timeline, legendas e TTS
  data/mockData.ts         # dados mockados (mídia, legendas, jobs)
  data/projects.ts         # dados mockados de projetos
  types/navigation.ts      # tipos de navegação de telas
  core/ai/contracts.ts     # contratos de tipos para pipelines de IA
  core/ai/stubs.ts         # stubs de integrações e catálogo de vozes
  core/jobs/queue.ts       # fila simulada (ponto de troca para Redis/BullMQ)
```

### Princípios adotados

- **Base real e demonstrável localmente**.
- **Separação de responsabilidades** entre UI, dados mock e contratos de integração.
- **Honestidade técnica**: funcionalidades de IA avançada estão stubadas, com caminho claro de evolução.

## Executando localmente

Pré-requisito: Node.js 20+

```bash
npm install
npm run dev
```

Abrir: `http://localhost:5173`

Fluxo sugerido para validar localmente:
1. Landing: clique em **Ver projetos**.
2. Dashboard: selecione um projeto e clique em **Abrir no editor**.
3. Editor: faça upload de mídia, interaja com a timeline, adicione/edite legendas e teste o TTS mockado.

### Comandos úteis

```bash
npm run lint
npm run build
```

## Limitações atuais

- Sem backend persistente.
- Sem renderização real de vídeo/export final.
- Sem integração real com provedores de IA/TTS/STT.
- Jobs assíncronos simulados em memória (sem Redis/BullMQ ainda).
- Dashboard e projetos ainda operam com dados mockados (sem autenticação nem banco).

## Próximos passos recomendados

1. Backend/API para projetos, ativos e timelines persistidas.
2. Worker de jobs assíncronos (BullMQ + Redis).
3. Pipeline real de transcrição automática (Whisper/API).
4. Pipeline real de TTS por provider configurável.
5. Pipeline de render/export com FFmpeg.
6. Conectores para imagem→vídeo e texto→vídeo com controle de custo/limites.
7. Políticas de uso justo/BYOK para escalar sem promessas irreais.

# Editor

Base inicial executável de um **editor de vídeo com IA** focado em evolução realista.

> Este PR não promete geração “ilimitada” nem “perfeitamente realista”.
> A geração pesada de vídeo por IA exige custos de GPU, filas e provedores externos.

## O que já existe neste MVP

- App web em **React + TypeScript + Vite**.
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
  App.tsx                  # UI principal do editor e fluxo local
  data/mockData.ts         # dados mockados (mídia, legendas, jobs)
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

## Próximos passos recomendados

1. Backend/API para projetos, ativos e timelines persistidas.
2. Worker de jobs assíncronos (BullMQ + Redis).
3. Pipeline real de transcrição automática (Whisper/API).
4. Pipeline real de TTS por provider configurável.
5. Pipeline de render/export com FFmpeg.
6. Conectores para imagem→vídeo e texto→vídeo com controle de custo/limites.
7. Políticas de uso justo/BYOK para escalar sem promessas irreais.

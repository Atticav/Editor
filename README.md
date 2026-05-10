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
- Módulo de **narração/TTS** com catálogo rico de vozes (stub) e seleção de emoção.
  - **38 vozes** catalogadas cobrindo PT-BR e variantes de Inglês (EUA, Reino Unido, Austrália, Índia).
  - Filtros de idioma e gênero para facilitar a navegação no catálogo.
  - Seletor de **emoção** por voz (neutro, feliz, triste, ansioso, sussurrando, medo, surpreso, suspeitando e outras).
  - Área de roteiro ampliada com contador de palavras/caracteres.
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

## Sistema de vozes (catálogo expandido)

O catálogo de vozes vive em `src/core/ai/stubs.ts` e é tipado em `src/core/ai/contracts.ts`.

### Atributos de cada voz

| Atributo | Tipo | Descrição |
|---|---|---|
| `id` | string | Identificador único usado no job de TTS |
| `label` | string | Nome amigável exibido na UI |
| `locale` | string | BCP-47 locale (ex.: `pt-BR`, `en-US`) |
| `language` | enum | Idioma/variante (`pt-BR`, `en-US`, `en-GB`, `en-AU`, `en-IN`) |
| `gender` | enum | `feminino`, `masculino` ou `neutro` |
| `ageGroup` | enum | `jovem`, `adulto` ou `idoso` |
| `accent` | string? | Descrição opcional do sotaque |
| `style` | string | Descrição curta do estilo de narração |
| `description` | string | Descrição completa para exibição na UI |
| `emotions` | enum[] | Emoções suportadas pela voz |
| `useCases` | enum[] | Casos de uso recomendados |

### Emoções suportadas

`neutro` · `feliz` · `triste` · `ansioso` · `sussurrando` · `medo` · `surpreso` · `suspeitando` · `animado` · `calmo` · `sério` · `dramático` · `irônico`

### Casos de uso

`tutorial` · `anúncio` · `narrativa` · `institucional` · `dramático` · `entretenimento` · `notícias` · `documentário` · `audiolibro`

### Vozes PT-BR incluídas

| Voz | Gênero | Idade | Estilo |
|---|---|---|---|
| Clara | Feminino | Adulto | Didática natural |
| Ana | Feminino | Adulto | Suave e acolhedora |
| Beatriz | Feminino | Adulto | Tranquila e profissional |
| Camila | Feminino | Jovem | Jovial e natural |
| Diana | Feminino | Adulto | Narrativa envolvente |
| Fernanda | Feminino | Adulto | Clara e motivadora |
| Helena | Feminino | Idoso | Sábia e serena |
| Isabela | Feminino | Jovem | Amigável e informal |
| Júlia | Feminino | Adulto | Precisa e técnica |
| Lívia | Feminino | Adulto | Melodiosa e cativante |
| Marina | Feminino | Adulto | Dinâmica e expressiva |
| Rafael | Masculino | Adulto | Narrador técnico |
| Marcos | Masculino | Adulto | Grave e profissional |
| Diego | Masculino | Jovem | Energético e jovem |

### Próximos passos para integração real de TTS

1. Escolher um provedor de TTS (ElevenLabs, Azure Cognitive Speech, Google Cloud TTS, OpenAI TTS, etc.).
2. Substituir `src/core/ai/stubs.ts → requestJob('tts-narration', …)` pelo SDK do provedor escolhido.
3. Mapear os IDs das vozes do catálogo para os IDs reais do provedor.
4. Mapear as emoções do catálogo para os parâmetros de estilo/SSML do provedor.
5. Entregar o áudio gerado ao player para reprodução no editor.



1. Backend/API para projetos, ativos e timelines persistidas.
2. Worker de jobs assíncronos (BullMQ + Redis).
3. Pipeline real de transcrição automática (Whisper/API).
4. Pipeline real de TTS por provider configurável.
5. Pipeline de render/export com FFmpeg.
6. Conectores para imagem→vídeo e texto→vídeo com controle de custo/limites.
7. Políticas de uso justo/BYOK para escalar sem promessas irreais.

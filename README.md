# Editor

Editor de vídeo local em React + TypeScript + Vite.

> **Honestidade técnica:** Este é um MVP local. Geração pesada de vídeo por IA exige GPU, filas e provedores externos — isso não está incluído nesta versão. O que funciona localmente está claramente indicado abaixo.

## O que funciona localmente (sem backend)

- **Upload de mídia** com pré-visualização imediata (vídeo, imagem, áudio).
- **Legendas sobre o preview** — legendas adicionadas aparecem sobrepostas ao preview. Para vídeo real, sincronizam com o tempo de reprodução.
- **Narração por voz do navegador** (Web Speech API) — clique em "▶ Falar narração" para reproduzir o texto com a voz do sistema. A voz exata depende das vozes instaladas no seu SO/navegador. A emoção e o estilo são do catálogo — a correspondência com as vozes do sistema é aproximada.
- **Painel lateral em abas** — Legendas / Narração / IA e Jobs, navegáveis independentemente.
- **Projetos locais úteis** — criação rápida no dashboard, separação visual entre projeto seu e projeto demo, e persistência em `localStorage`.
- **Persistência por projeto** — legendas, texto de narração e aba ativa do editor ficam salvos em `localStorage` por projeto.
- **Timeline interativa** — clique nos clipes para selecionar a mídia ativa.
- **Biblioteca de mídia** — itens de demonstração identificados com 📦; itens reais com ✅.
- **Controles rápidos de conforto** — limpar jobs, limpar legendas, duplicar legenda e resetar dados locais.

## O que é demonstração / requer integração futura

| Funcionalidade | Status |
|---|---|
| Projetos no Dashboard | ✅ Criação de projetos locais com persistência no navegador |
| Projetos demo | ✅ Mantidos como referência visual (`isDemo: true`) |
| Último projeto selecionado | ✅ Persistido em `localStorage` |
| Persistência de legendas/narração/aba | ✅ Por projeto, em `localStorage` |
| Uploads locais de mídia | ⚠️ Não persistem após recarregar (limitação do browser sem backend/File System API) |
| Exportar vídeo | ❌ Requer FFmpeg/pipeline de render externo |
| Imagem → Vídeo / Texto → Vídeo | ❌ Requer provider externo (RunwayML, Kling, etc.) |
| Transcrição automática | ❌ Requer Whisper ou API equivalente |
| TTS com voz específica/sintética | ⚠️ Web Speech API usa vozes instaladas no SO; para vozes sintéticas customizadas, requer ElevenLabs/Azure/OpenAI TTS |
| Jobs assíncronos reais | ❌ Simulados em memória (sem Redis/BullMQ) |

## Executando localmente

Pré-requisito: Node.js 20+

```bash
npm install
npm run dev
```

Abrir: `http://localhost:5173`

Fluxo sugerido:
1. **Dashboard** → clique em "+ Criar projeto" para criar um projeto seu (salvo localmente), ou selecione um dos exemplos de demonstração.
2. **Editor** → faça upload de mídia (vídeo/imagem/áudio).
3. Aba **Legendas** → adicione, duplique ou limpe legendas; elas aparecem sobre o preview e ficam salvas por projeto.
4. Aba **Narração** → selecione idioma/gênero/voz, escreva o texto e clique em "▶ Falar narração". O texto fica salvo localmente.
5. Aba **IA / Jobs** → veja e limpe o histórico de jobs da sessão.

### Comandos úteis

```bash
npm run lint
npm run build
```

## Arquitetura

```text
src/
  App.tsx                  # navegação + projetos locais + seleção persistida
  pages/
    LandingPage.tsx        # apresentação do produto
    DashboardPage.tsx      # projetos locais vs demo + criação/reset de dados locais
    EditorPage.tsx         # editor com persistência por projeto, overlay de legendas e narração Web Speech API
  data/mockData.ts         # dados de demonstração (mídia, legendas, jobs iniciais)
  data/projects.ts         # projetos seed (isDemo: true) + interface ProjectSummary
  types/navigation.ts      # tipos de navegação de telas
  core/ai/contracts.ts     # tipos para pipelines de IA
  core/ai/stubs.ts         # catálogo de vozes (38 vozes PT-BR e Inglês) + stubs de jobs
  core/jobs/queue.ts       # fila simulada (ponto de troca para Redis/BullMQ)
```

## Sistema de vozes

O catálogo em `src/core/ai/stubs.ts` tem **38 vozes** cobrindo PT-BR e variantes de Inglês (EUA, Reino Unido, Austrália, Índia).

A narração usa **Web Speech API** do navegador: o locale da voz selecionada é passado para o sistema operacional, que usa a voz instalada mais próxima. Para vozes sintéticas personalizadas, é necessário integrar um provedor externo (ElevenLabs, Azure Cognitive Speech, Google Cloud TTS, OpenAI TTS, etc.).

### Próximos passos para TTS real

1. Escolher provedor (ElevenLabs, Azure, Google, OpenAI TTS).
2. Substituir `speakNarration()` em `EditorPage.tsx` pela chamada ao SDK do provedor.
3. Mapear IDs e emoções do catálogo para parâmetros do provedor.
4. Entregar o áudio gerado ao `<audio>` ou `<video>` do player para reprodução sincronizada.

## Limitações conhecidas

- Sem backend persistente — uploads locais de mídia somem ao recarregar a página.
- Sem render/export real de vídeo.
- Sem integração com provedores de IA/TTS/STT externos.
- Web Speech API depende de suporte do navegador e de vozes instaladas no sistema.
- Jobs assíncronos simulados em memória.

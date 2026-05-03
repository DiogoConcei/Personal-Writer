# PRD — Sistema de Plugins e Extensões (Add-ons)

**Visão Geral:**
Para manter o núcleo do editor performático e focado em texto, todas as funcionalidades de nicho (Acadêmicas, Desenvolvedor, Design e Estudo de Línguas) seriam estruturadas como Plugins. **A maioria dos planos abaixo foi descontinuada para focar na estabilidade do núcleo.**

## Nível 1: Baixa Complexidade (Quick Wins / UI)
_Módulos simplificados._

## Nível 2: Média Complexidade (APIs e Integrações Locais)

- **Terminal Integrado (Plugin DevTools):** ❌ **Abandonado.**
- **Word Insights - Fonética (Plugin Estudo de Línguas):** ❌ **Abandonado.**
- **Pronúncia Ativa TTS (Plugin Estudo de Línguas):** ❌ **Abandonado.**
- **Exportação Literária (Plugin Escritor):** ❌ **Abandonado.**
- **Tradução Inline (Plugin Estudo de Línguas):** ❌ **Abandonado.**
- **Mood Board (Plugin Design):** ✅ **Implementado.** Mural de referências visuais para colagem de imagens e inspiração.

## Plugins Implementados (Fase Atual)

- **Desenho Livre (Plugin Design):** ✅ **Implementado.** Integração completa com Excalidraw.
- **Galeria de Personagens & Localidades:** ✅ **Implementado.** Sistema de metadados e templates.
- **Dashboard & Timeline:** ✅ **Implementado.** Visão geral do projeto e organização de notas.

## Nível 3: Alta Complexidade (Engine Rust, WASM e P2P)

- **Colaboração P2P em Tempo Real:** ❌ **Abandonado.**
- **Workspaces Compartilhados:** ❌ **Abandonado.**
- **Advanced Code Blocks - Pyodide:** ❌ **Abandonado.**
- **Infinite Canvas (Plugin Planejamento Visual):** ✅ **Implementado.** Quadro branco espacial infinito.
- **Editor de Imagens Non-Destructive:** ❌ **Abandonado.**
- **Sandboxes de Execução WASM:** ❌ **Abandonado.**
- **Motor de Indexação SQLite:** ❌ **Abandonado.**

## Nível 4: Complexidade Extrema

- **Analisador de Complexidade (Big O):** ❌ **Abandonado.**

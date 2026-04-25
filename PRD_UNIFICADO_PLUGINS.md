# PRD — Sistema de Plugins e Extensões (Add-ons)

**Visão Geral:**
Para manter o núcleo do editor performático e focado em texto, todas as funcionalidades de nicho (Acadêmicas, Desenvolvedor, Design e Estudo de Línguas) serão estruturadas como **Plugins (Add-ons)**. O usuário terá uma \"Página de Configurações\" (Plugin Manager) onde poderá baixar, habilitar e desabilitar módulos sob demanda, personalizando o software de acordo com seu perfil de uso.

## Nível 1: Baixa Complexidade (Quick Wins / UI)

_Funcionalidades predominantemente de frontend ou que utilizam bibliotecas prontas que podem ser ativadas e desativadas facilmente._

## Nível 2: Média Complexidade (APIs e Integrações Locais)

_Módulos que requerem chamadas de sistema (Tauri) ou processamento de dados locais assíncronos._

- **Terminal Integrado (Plugin DevTools):** Painel (Drawer) inferior com terminal funcional conectado ao shell nativo usando `xterm.js` no frontend e um Pseudoterminal (PTY) no backend Rust.
- **Word Insights - Fonética (Plugin Estudo de Línguas):** Exibição da transcrição fonética (IPA) ao selecionar uma palavra, consumindo um banco de dados leve.
- **Pronúncia Ativa TTS (Plugin Estudo de Línguas):** Botão nativo para ouvir a pronúncia de trechos de texto através de uma ponte do Tauri com a API de acessibilidade de áudio do sistema operacional.
- **Exportação Literária (Plugin Escritor):** Gerador de manuscritos prontos (PDF e DOCX no padrão Times New Roman 12, Espaço Duplo), extraindo parâmetros dos metadados das notas.
- **Tradução Inline (Plugin Estudo de Línguas):** Tooltip flutuante exibindo a tradução de sentenças complexas sob demanda, mantendo o fluxo de leitura.
- **Mood Board (Plugin Design):** ✅ **Implementado.** Mural de referências visuais para colagem de imagens e inspiração, focado em simplicidade e organização rápida.

## Plugins Implementados (Fase Atual)

_Funcionalidades já integradas ao ecossistema core._

- **Desenho Livre (Plugin Design):** ✅ **Implementado.** Integração completa com Excalidraw para esboços, wireframes e diagramas rápidos com estética de quadro branco.
- **Galeria de Personagens & Localidades:** ✅ **Implementado.** Sistema de metadados e templates para gestão visual de elementos da narrativa.
- **Dashboard & Timeline:** ✅ **Implementado.** Visão geral do projeto e organização de notas em formato de cards.

## Nível 3: Alta Complexidade (Engine Rust, WASM e P2P)

_Sistemas que requerem manipulação profunda de rede, renderização avançada em canvas ou motores WebAssembly isolados._

- **Reading Level Indicator (Plugin Linguística Avançada):** Motor offline em Rust calculando o nível de complexidade do texto (Flesch-Kincaid / CEFR) e sincronizando a pontuação em tempo real na barra de status.
- **Colaboração P2P em Tempo Real (Plugin Colaborativo):** Edição simultânea sem servidor usando CRDTs (Yjs ou Automerge) transmitidos via WebRTC e conexões de rede local. _(Inclui: Indicadores de Presença e Cursores Coloridos)_.
- **Workspaces Compartilhados (Plugin Colaborativo):** Compartilhamento de pastas inteiras via Criptografia Ponta-a-Ponta (E2EE) nativa com sistema visual de resolução de conflitos em caso de edições offline.
- **Advanced Code Blocks - Pyodide (Plugin Data Science):** Download e inicialização do ecossistema Pyodide (Python compilado para WebAssembly) para que o usuário consiga plotar gráficos e rodar análises diretamente dentro das notas markdown sem travar a interface.
- **Infinite Canvas (Plugin Planejamento Visual):** ✅ **Implementado.** Quadro branco espacial infinito que permite que imagens, notas `.md` e PDFs sejam arrastados, rotacionados no eixo Z e configurados visualmente, utilizando renderização virtualizada para suportar grandes volumes de dados.
    - *Nota Técnica (Estabilização de PDF):* ✅ **Concluído.** Melhorias no resize e extração de páginas implementadas para fluidez máxima.
- **Editor de Imagens Non-Destructive (Plugin Design):** Edições básicas de Crop e Filtros salvos como deltas matemáticos JSON, mantendo a imagem original intacta, renderizados via Rust na visualização da galeria.
- **Sandboxes de Execução WASM (Plugin DevTools Extremo):** Execução isolada de linguagens pesadas (C, Rust nativo) com segurança local, renderizando um painel de output compilado no frontend.
- **Motor de Indexação SQLite (Plugin Alta Performance):** Cache local no backend em SQLite replicando dados YAML e links dos arquivos em tempo real para possibilitar buscas e agregações complexas instantâneas (DataView).

## Nível 4: Complexidade Extrema (Pesquisa Científica/Teórica)

_Módulos que requerem anos de engenharia, parsers sintáticos completos e alto risco arquitetural._

- **Analisador de Complexidade (Big O):** Ferramenta heurística offline (sem IA) que examina estaticamente o código em C/Python escrito pelo usuário para sugerir a notação de complexidade algorítmica ($O(n^2)$), exigindo a construção de validadores de Árvores de Sintaxe Abstrata (AST) multi-linguagem.

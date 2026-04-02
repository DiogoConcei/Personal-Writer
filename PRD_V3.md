# PRD — O Espaço Criativo (V3: Visual e Assets)

**Versão:** 3.0  
**Foco:** Brainstorming Visual e Gestão de Mídia  
**Stack Base:** Excalidraw-like Canvas (Canvas API/SVG) · Sharp (Rust) para Processamento de Imagem

---

## 1. Visão Geral
Expandir o editor para além do texto, oferecendo um espaço de pensamento espacial ("Infinite Canvas") e ferramentas avançadas para lidar com assets visuais (imagens e diagramas) com controle de versões.

---

## 2. Features Planejadas

### Feature 1 — Infinite Canvas (Modo Lousa)
**Objetivo:** Criar mapas conceituais, storyboards e fluxogramas livres.
- **Interface:** Zoom infinito, panning e ferramentas de desenho (formas, setas, notas adesivas).
- **Integração:** Possibilidade de arrastar notas `.md` para o canvas como "blocos de texto" vivos.
- **Persistência:** Formato `.canvas.json` salvo no workspace.

### Feature 2 — Editor de Imagens Integrado
**Objetivo:** Realizar edições básicas sem depender de softwares externos.
- **Ferramentas:** Crop (Corte), Resize (Redimensionamento proporcional), Brilho/Contraste e Rotação.
- **Backend (Rust):** Utilização da crate `image` para processar as alterações no disco de forma performática.

### Feature 3 — Versões Paralelas de Assets (Non-Destructive)
**Objetivo:** Testar diferentes edições de uma imagem ou diagrama sem perder o original.
- **Mecânica:** Ao editar um asset, o sistema cria uma "versão" (ex: `hero_v1.png`, `hero_v2.png`).
- **UI:** Toggle rápido no componente de imagem para alternar entre versões salvas.
- **Limpeza:** Ferramenta para "Consolidar Versão Final" e apagar temporários.

### Feature 4 — Mood Board Espacial
**Objetivo:** Fixar referências visuais em uma área de trabalho paralela à escrita.
- **Funcionalidade:** Painel lateral ou aba de canvas onde imagens podem ser agrupadas, sobrepostas e conectadas por linhas de raciocínio.
- **Drag-and-Drop:** Arrastar imagens do navegador ou do computador diretamente para o Mood Board.

---

## 3. Requisitos Técnicos e Arquitetura

1.  **Canvas Rendering:** Utilização de Canvas API ou SVG (via `react-konva` ou similar) para garantir que milhares de elementos não degradem a performance.
2.  **Asset Manager (Rust):** Um módulo dedicado no backend para monitorar a pasta `/assets` e gerenciar os metadados de versionamento de binários.
3.  **Virtualization:** Implementação de virtualização para o Canvas, renderizando apenas o que está visível na viewport.

---

## 4. Critérios de Aceitação
- [ ] O Canvas deve suportar pelo menos 500 elementos ativos sem queda de FPS (60fps).
- [ ] Edições de imagem (Crop/Resize) devem ser refletidas no editor TipTap instantaneamente.
- [ ] O versionamento de assets não deve duplicar arquivos desnecessariamente (apenas quando houver alteração real).

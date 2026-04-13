# PRD — Imagens e Assets

**Foco:** Gestão de mídia, processamento de imagem e referências visuais.

---

## Features Principais

### Feature 1 — Editor de Imagens Integrado
**Objetivo:** Realizar edições básicas sem depender de softwares externos.
- **Ferramentas:** Crop (Corte), Resize (Redimensionamento proporcional), Brilho/Contraste e Rotação.
- **Backend (Rust):** Utilização da crate `image` para processamento performático.

### Feature 2 — Versões Paralelas de Assets (Non-Destructive)
**Objetivo:** Testar diferentes edições de uma imagem sem perder o original.
- **Mecânica:** Criação de versões (ex: `hero_v1.png`, `hero_v2.png`) com toggle rápido na UI.
- **Consolidação:** Ferramenta para escolher a versão final e limpar arquivos temporários.

### Feature 3 — Mood Board Espacial
**Objetivo:** Fixar referências visuais em uma área de trabalho paralela à escrita.
- **Funcionalidade:** Painel lateral onde imagens podem ser agrupadas e sobrepostas.
- **Drag-and-Drop:** Suporte a arrastar do navegador ou computador diretamente para o board.

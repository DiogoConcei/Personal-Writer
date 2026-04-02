# PRD — Editor Híbrido (V1)
**Versão:** 1.6 (Organização Avançada e Gestão de Versões)  
**Stack:** Tauri 2 · React 19 · TypeScript · TipTap 3 · Zustand · SCSS Modules · Rust  
**Objetivo:** Definir o escopo mínimo completo e verificar o progresso real.

---

## 1. Visão do Produto
Um editor de notas local-first para uso pessoal dual: estudo de Ciência da Computação e escrita criativa de ficção. Gerenciamento de arquivos reais (`.md`) com metadados YAML.

---

## 2. Status das Features da V1

### Feature 1 — Editor Rich Text com Auto-Save
**Status:** 🟢 **Concluído**
- [x] Renderização e edição de arquivos `.md`
- [x] **Auto-save:** Dispara após 1500ms de inatividade.
- [x] **Tipografia Avançada:** Alternância entre Sans/Serif e controle granular de Família de Fonte e Tamanho via Bubble Menu.
- [x] **Bubble Menu:** Menu flutuante de formatação inteligente (esconde ao selecionar imagens).

### Feature 2 — File Tree + Organização
**Status:** 🟢 **Concluído**
- [x] Árvore hierárquica com distinção entre pastas e arquivos.
- [x] **Drag-and-Drop:** Movimentação fluida de arquivos e pastas via Mouse Events (independente de API de browser).
- [x] **Atualizações Otimistas:** Mudanças refletidas instantaneamente na UI antes da confirmação do disco.
- [x] **Pastas Virtuais:** Pasta "Imagens" virtualizada dentro de cada diretório.

### Feature 3 — WikiLinks (`[[Nota]]`)
**Status:** 🟢 **Concluído**
- [x] Autocomplete ao digitar `[[`.
- [x] Navegação por clique e criação automática de notas.

### Feature 4 — Dashboard de Cards
**Status:** 🟢 **Concluído**
- [x] Grid de cards com ordenação por data e visualização de ícones/atributos.

### Feature 5 — Imagens Inline (Local-First)
**Status:** 🟢 **Concluído**
- [x] **Galeria Integrada:** Upload local direto para a pasta `/assets/` e criação de subpastas.
- [x] **Alinhamento Completo:** Na linha, À Esquerda, Ao Centro e À Direita.
- [x] Redimensionamento proporcional e modo tela cheia.

### Feature 6 — Busca Rápida (Command Palette)
**Status:** 🟢 **Concluído**
- [x] Busca Fuzzy e Ações Rápidas (`Ctrl + P`).

---

## 3. Funcionalidades "Bônus"

### Feature 7 — Notas Estruturadas (Metadata Header V2)
**Status:** 🟢 **Concluído**
- [x] Suporte a Texto, Número e **Select (Dropdown)**.
- [x] Layout simétrico com ajuste dinâmico de resumo.

### Feature 8 — Histórico de Versões (Time Machine)
**Status:** 🟢 **Concluído**
- [x] Snapshots automáticos e restauração segura.
- [x] **Marcos (Milestones):** Funcionalidade de congelar/trancar versões importantes para evitar exclusão.

---

## 4. Próximos Passos Imediatos

1.  **Revisão do Preview de Histórico:** Corrigir bugs de escala e renderização para habilitar novamente o preview visual de versões.

estones):** Funcionalidade de congelar/trancar versões importantes para evitar exclusão.

---

## 4. Próximos Passos Imediatos

1.  **Revisão do Preview de Histórico:** Corrigir bugs de escala e renderização para habilitar novamente o preview visual de versões.
2.  **Breadcrumbs Interativos:** Permitir clicar nos níveis do caminho para navegar até as pastas.
3.  **Refinamento Final de Estilo:** Ajustes de polimento visual e consistência de cores em estados de hover.

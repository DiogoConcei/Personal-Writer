# PRD — Editor Híbrido (V1)
**Versão:** 1.5 (UX Premium e Busca Instantânea)  
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
- [x] **Tipografia:** Alternância entre Sans e Serif no header.
- [x] **Bubble Menu:** Menu flutuante de formatação ao selecionar texto (Bold, Italic, Code, etc).

### Feature 2 — File Tree + Operações de Disco
**Status:** 🟢 **Concluído**
- [x] Árvore hierárquica com distinção entre pastas e arquivos.
- [x] **Pastas Virtuais:** Pasta "Imagens" virtualizada dentro de cada diretório, espelhando os assets reais.
- [x] Criar, Renomear e Excluir arquivos/pastas.

### Feature 3 — WikiLinks (`[[Nota]]`)
**Status:** 🟢 **Concluído**
- [x] Arquitetura de Node estável (Inline Atom).
- [x] Autocomplete ao digitar `[[`.
- [x] Navegação por clique e criação automática de notas.

### Feature 4 — Dashboard de Cards
**Status:** 🟢 **Concluído**
- [x] Grid de cards com ordenação por data.
- [x] Visualização de Ícone e Atributos dinâmicos nos cards.

### Feature 5 — Imagens Inline (Local-First)
**Status:** 🟢 **Concluído**
- [x] **Localização Automática:** Imagens coladas ou soltas são salvas em subpastas organizadas em `/assets/`.
- [x] **Layout Fluido:** Suporte real a `float` (texto à direita/esquerda) com alinhamento no topo.
- [x] Redimensionamento proporcional e modo tela cheia.

### Feature 6 — Busca Rápida (Command Palette)
**Status:** 🟢 **Concluído**
- [x] **Atalhos:** `Ctrl + P` ou `Ctrl + K` abre a busca global.
- [x] **Busca Fuzzy:** Encontra arquivos instantaneamente pelo nome.
- [x] **Ações Rápidas:** Executa comandos do sistema (Trocar Workspace, Alternar Sidebar) via teclado.

---

## 3. Funcionalidades "Bônus"

### Feature 7 — Notas Estruturadas (Metadata Header V2)
**Status:** 🟢 **Concluído**
- [x] **Título Dinâmico:** Exibe o nome da nota automaticamente.
- [x] **Tipos de Campos:** Suporte a Texto, Número e **Select (Dropdown)**.
- [x] **Configuração Visual:** Interface para definir opções de select e tipos de dados sem editar YAML manualmente.
- [x] **Modais Customizados:** Fim dos prompts do sistema; interface integrada Amethyst.

### Feature 8 — Histórico de Versões
- [x] Snapshots automáticos e restauração com preview completo (incluindo cabeçalho).

---

## 4. Próximos Passos Imediatos

1.  **Breadcrumbs Interativos:** Permitir clicar nos níveis do caminho para navegar até as pastas.
2.  **Refinamento Final de Estilo:** Ajustes de polimento visual e consistência de cores em estados de hover.

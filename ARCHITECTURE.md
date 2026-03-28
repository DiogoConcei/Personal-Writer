# ARCHITECTURE.md — Editor Híbrido

**Versão:** 1.0  
**Stack:** Tauri 2 · React 19 · TypeScript · TipTap 2 · Zustand · SCSS Modules · Rust

Este documento registra decisões arquiteturais definitivas. Qualquer desvio deve ser justificado e documentado aqui antes de ser implementado.

---

## 1. Estrutura de Pastas

```
editor-hibrido/
├── src-tauri/                      # Backend Rust (Tauri)
│   ├── src/
│   │   ├── main.rs
│   │   ├── commands/               # Um arquivo por domínio de comando
│   │   │   ├── fs.rs               # read_file, write_file, list_directory, etc.
│   │   │   └── search.rs           # search_files_by_name
│   │   └── lib.rs                  # Registro de todos os comandos (.invoke_handler)
│   └── tauri.conf.json
│
└── src/                            # Frontend React + TypeScript
    ├── app/
    │   ├── App.tsx                 # Root: providers + layout principal
    │   ├── App.module.scss
    │   └── providers.tsx           # Zustand hydration, theme setup
    │
    ├── tauri-bridge/               # ÚNICO ponto de contato com o backend Rust
    │   ├── index.ts                # Re-exporta tudo
    │   ├── fs.ts                   # Wrappers tipados para comandos de filesystem
    │   ├── search.ts               # Wrappers para busca
    │   └── types.ts                # FileNode e demais tipos compartilhados
    │
    ├── features/                   # Módulos por domínio (Feature-Sliced Design)
    │   ├── editor/
    │   │   ├── components/
    │   │   │   ├── Editor.tsx              # Componente raiz do TipTap
    │   │   │   ├── Editor.module.scss
    │   │   │   ├── StatusBar.tsx           # Contador de palavras + status de save
    │   │   │   ├── StatusBar.module.scss
    │   │   │   └── extensions/             # Extensões customizadas do TipTap
    │   │   │       ├── WikiLink/
    │   │   │           ├── WikiLink.ts     # Definição da extensão
    │   │   │           ├── WikiLinkNode.ts # NodeView React do WikiLink
    │   │   │           └── WikiLinkPopover.tsx  # Autocomplete ao digitar [[
    │   │   │       └── Image/
    │   │   │           ├── Image.ts            # Extensão TipTap (resize + float)
    │   │   │           ├── ImageNode.tsx       # NodeView com handles de resize
    │   │   │           ├── ImageToolbar.tsx    # Toolbar contextual (alinhamento, float)
    │   │   │           └── ImageFullscreen.tsx # Overlay de tela cheia
    │   │   └── store/
    │   │       └── editorStore.ts          # Zustand: arquivo ativo, conteúdo, save status
    │   │
    │   ├── workspace/
    │   │   ├── components/
    │   │   │   ├── FileTree.tsx            # Árvore hierárquica
    │   │   │   ├── FileTree.module.scss
    │   │   │   ├── FileTreeItem.tsx        # Item individual (arquivo ou pasta)
    │   │   │   ├── FileTreeItem.module.scss
    │   │   │   ├── RenameInput.tsx         # Input inline para renomear
    │   │   │   └── DeleteModal.tsx         # Modal de confirmação de exclusão
    │   │   └── store/
    │   │       └── workspaceStore.ts       # Zustand: caminho raiz, árvore de arquivos
    │   │
    │   ├── dashboard/
    │   │   ├── components/
    │   │   │   ├── Dashboard.tsx           # Grid de cards
    │   │   │   ├── Dashboard.module.scss
    │   │   │   ├── NoteCard.tsx            # Card individual de nota
    │   │   │   └── NoteCard.module.scss
    │   │   └── (sem store própria — lê de workspaceStore)
    │   │
    │   └── search/
    │       ├── components/
    │       │   ├── SearchInput.tsx         # Input de busca por nome (Ctrl+F)
    │       │   └── SearchInput.module.scss
    │       └── (sem store própria — resultado filtrado localmente de workspaceStore)
    │
    ├── shared/                     # Código verdadeiramente reutilizável entre features
    │   ├── components/
    │   │   ├── Modal/
    │   │   │   ├── Modal.tsx
    │   │   │   └── Modal.module.scss
    │   │   ├── Breadcrumb/
    │   │   │   ├── Breadcrumb.tsx
    │   │   │   └── Breadcrumb.module.scss
    │   │   └── Header/
    │   │       ├── Header.tsx
    │   │       └── Header.module.scss
    │   ├── hooks/
    │   │   ├── useDebounce.ts      # Hook genérico de debounce (usado pelo auto-save)
    │   │   └── useKeyboardShortcut.ts  # Registro de atalhos globais
    │   ├── styles/
    │   │   ├── _variables.scss     # Tokens de design (cores, espaçamento, tipografia)
    │   │   ├── _mixins.scss        # Mixins reutilizáveis
    │   │   └── global.scss         # Reset + estilos base globais
    │   └── types/
    │       └── index.ts            # Re-exporta FileNode e tipos globais
    │
    └── store/
        └── uiStore.ts              # Zustand: modo foco, painel ativo, sidebar visível
```

---

## 2. Decisões Arquiteturais (ADRs)

### ADR-001 — Toda comunicação com Rust passa pela tauri-bridge

**Decisão:** Nenhum componente ou store usa `invoke()` diretamente. Toda chamada ao backend é feita através de funções exportadas por `src/tauri-bridge/`.

**Motivo:** Centraliza a tipagem dos comandos Rust, facilita mock em testes futuros, e documenta explicitamente a superfície da API nativa. Se um comando Rust mudar de nome, a correção acontece em um único lugar.

**Exemplo correto:**
```typescript
// src/tauri-bridge/fs.ts
import { invoke } from '@tauri-apps/api/core';
import type { FileNode } from './types';

export async function listDirectory(path: string): Promise<FileNode[]> {
  return invoke<FileNode[]>('list_directory', { path });
}

// Em qualquer componente ou store:
import { listDirectory } from '@/tauri-bridge';
```

**Exemplo proibido:**
```typescript
// NUNCA faça isso em componente ou store:
import { invoke } from '@tauri-apps/api/core';
const files = await invoke('list_directory', { path });
```

---

### ADR-002 — Stores Zustand são organizadas por domínio de feature

**Decisão:** Três stores separadas: `workspaceStore`, `editorStore`, `uiStore`. Nenhuma store importa outra store diretamente.

**Motivo:** Evita dependências circulares e mantém responsabilidades claras.

**Regras de ownership:**

| Store | É dona de |
|---|---|
| `workspaceStore` | Caminho raiz, árvore `FileNode[]`, arquivo ativo (path) |
| `editorStore` | Conteúdo do editor, status de save, tipografia selecionada |
| `uiStore` | Modo foco, painel ativo (`editor` \| `dashboard`), sidebar visível |

**Comunicação entre stores:** Quando uma ação em uma store precisa afetar outra, isso acontece no componente ou hook que orquestra a operação — não dentro das stores.

```typescript
// Correto: orquestração no componente
const { setActiveFile } = useWorkspaceStore();
const { loadContent } = useEditorStore();

async function openFile(path: string) {
  const content = await readFile(path); // tauri-bridge
  setActiveFile(path);                  // workspaceStore
  loadContent(content);                 // editorStore
}
```

---

### ADR-003 — SCSS Modules para todos os estilos de componente

**Decisão:** Cada componente tem seu arquivo `.module.scss` colocado na mesma pasta. Tokens globais vivem em `shared/styles/_variables.scss` e são importados onde necessário.

**Motivo:** Escopo isolado por componente sem conflito de classes. SCSS permite variáveis, mixins e nesting sem overhead de runtime.

**Estrutura de variáveis:**
```scss
// shared/styles/_variables.scss

// ---
// Paleta: Amethyst + Gunmetal
// Amethyst: púrpura/violeta como cor de acento e identidade
// Gunmetal: cinza escuro azulado como base neutra
// ---

:root {
  // Backgrounds (escala gunmetal)
  --color-bg-base:        #1c1f26;   // fundo principal do app
  --color-bg-surface:     #242830;   // sidebar, cards, painéis elevados
  --color-bg-elevated:    #2d3240;   // modais, popovers, tooltips
  --color-bg-hover:       #333848;   // hover em itens de lista

  // Bordas
  --color-border:         #3a3f52;   // separadores e bordas sutis
  --color-border-strong:  #4a5068;   // bordas com mais contraste

  // Texto
  --color-text-primary:   #e8eaf0;   // texto principal
  --color-text-secondary: #9da3b8;   // texto secundário, labels
  --color-text-muted:     #616882;   // placeholders, texto desabilitado

  // Acento — Amethyst
  --color-accent:         #9b72f5;   // cor principal de acento
  --color-accent-dim:     #7c5acc;   // acento mais escuro (hover, pressed)
  --color-accent-glow:    rgba(155, 114, 245, 0.18); // glow/halo suave

  // Semânticas
  --color-danger:         #e05c72;   // erro, exclusão, link quebrado
  --color-success:        #4caf7d;   // save confirmado, sucesso
  --color-warning:        #e0a45c;   // avisos

  // WikiLinks
  --color-wikilink-active:  var(--color-accent);
  --color-wikilink-broken:  var(--color-danger);

  // Tipografia
  --font-sans:   'Inter Variable', system-ui, sans-serif;
  --font-serif:  'Lora', 'Georgia', serif;
  --font-mono:   'JetBrains Mono', monospace;

  --font-size-xs:   11px;
  --font-size-sm:   13px;
  --font-size-md:   15px;
  --font-size-lg:   18px;
  --font-size-xl:   24px;

  --line-height-tight:  1.3;
  --line-height-body:   1.7;   // essencial para conforto na escrita longa

  // Espaçamento
  --spacing-xs:  4px;
  --spacing-sm:  8px;
  --spacing-md:  16px;
  --spacing-lg:  24px;
  --spacing-xl:  40px;

  // Layout
  --sidebar-width:      260px;
  --header-height:      48px;
  --statusbar-height:   28px;
  --editor-max-width:   720px;  // largura máxima da coluna de texto (conforto de leitura)

  // Bordas e raios
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;

  // Sombras
  --shadow-sm:  0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md:  0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg:  0 8px 32px rgba(0, 0, 0, 0.6);

  // Transições
  --transition-fast:    100ms ease;
  --transition-normal:  200ms ease;
}
```

**Uso em componente:**
```scss
// FileTree.module.scss
@use '@/shared/styles/variables' as *; // opcional — variáveis CSS já estão em :root

.container {
  width: var(--sidebar-width);
  background: var(--color-bg-secondary);
  
  &__item {
    padding: var(--spacing-sm) var(--spacing-md);
    
    &--active {
      color: var(--color-accent);
    }
  }
}
```

---

### ADR-004 — Extensões TipTap vivem em `features/editor/extensions/`

**Decisão:** Cada extensão customizada (WikiLink, futuramente Callout, Mermaid) é uma pasta própria com seus arquivos separados.

**Motivo:** Extensões TipTap combinam lógica de extensão (`.ts`), NodeView React (`.tsx`) e UI auxiliar (popovers, menus). Manter tudo junto por extensão evita arquivos enormes.

---

### ADR-005 — Sem `any` no TypeScript

**Decisão:** `any` é proibido. `tsconfig.json` deve ter `"strict": true` e `"noImplicitAny": true`.

**Alternativas aceitáveis:**
- `unknown` quando o tipo realmente não é conhecido, com narrowing explícito
- Generics quando o tipo varia mas é controlado
- Tipos de terceiros quando a lib não exporta o que precisa (`Parameters<typeof fn>[0]`)

---

### ADR-006 — Formato de nota é Markdown texto plano

**Decisão:** Todos os arquivos são `.md` salvo como texto plano UTF-8. WikiLinks usam sintaxe `[[Nome]]` compatível com Obsidian.

**Motivo:** Zero vendor lock-in. O usuário pode abrir qualquer nota em qualquer outro editor. Migrar para outro app no futuro não requer conversão.

---

## 3. Convenções de Código

### Nomenclatura
- **Componentes React:** PascalCase (`FileTreeItem.tsx`)
- **Hooks:** camelCase com prefixo `use` (`useDebounce.ts`)
- **Stores Zustand:** camelCase com sufixo `Store` (`workspaceStore.ts`)
- **Arquivos de bridge:** camelCase por domínio (`fs.ts`, `search.ts`)
- **Classes SCSS:** BEM — `.block__element--modifier`

### Componentes
- Apenas componentes funcionais com hooks
- Props sempre tipadas com `interface`, nunca `type` inline anônimo
- Componentes exportados como `export default` (um por arquivo)
- Utilitários e hooks exportados como named exports

### Commits (para referência futura)
```
feat(editor): adiciona debounce no auto-save
fix(workspace): corrige colisão de nomes ao criar arquivo
refactor(bridge): extrai search commands para módulo separado
```

---

## 4. Fluxo de Dados Principal

```
Usuário digita no editor
        ↓
  Editor.tsx (TipTap onUpdate)
        ↓
  editorStore.setContent(content)   ← debounce 1500ms
        ↓
  editorStore.save()
        ↓
  tauri-bridge/fs.writeFile(path, content)
        ↓
  Rust: commands/fs.rs write_file
        ↓
  editorStore.setSaveStatus('saved')
        ↓
  StatusBar.tsx re-renderiza
```

```
Usuário clica em arquivo na FileTree
        ↓
  FileTreeItem.tsx onClick
        ↓
  openFile(path)  ← hook de orquestração em App.tsx ou layout
        ↓
  tauri-bridge/fs.readFile(path)     tauri-bridge/fs.readFile → Rust
  workspaceStore.setActiveFile(path)
  editorStore.loadContent(content)
        ↓
  Editor.tsx re-renderiza com novo conteúdo
```

---

## 5. O que NÃO fazer (anti-patterns proibidos)

| Anti-pattern | Por quê é proibido |
|---|---|
| `invoke()` direto em componente | Viola ADR-001 |
| Store importando outra store | Viola ADR-002, cria dependência circular |
| Estilos inline (`style={{}}`) para layout | Use SCSS Module |
| `useEffect` para sincronizar estado derivado | Use seletores Zustand ou `useMemo` |
| Lógica de negócio dentro de JSX | Extraia para função ou hook |
| Prop drilling com mais de 2 níveis | Use store Zustand |
| Componente com mais de ~200 linhas | Quebre em subcomponentes |

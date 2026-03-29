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
import { invoke } from "@tauri-apps/api/core";
import type { FileNode } from "./types";

export async function listDirectory(path: string): Promise<FileNode[]> {
  return invoke<FileNode[]>("list_directory", { path });
}

// Em qualquer componente ou store:
import { listDirectory } from "@/tauri-bridge";
```

**Exemplo proibido:**

```typescript
// NUNCA faça isso em componente ou store:
import { invoke } from "@tauri-apps/api/core";
const files = await invoke("list_directory", { path });
```

---

### ADR-002 — Stores Zustand são organizadas por domínio de feature

**Decisão:** Três stores separadas: `workspaceStore`, `editorStore`, `uiStore`. Nenhuma store importa outra store diretamente.

**Motivo:** Evita dependências circulares e mantém responsabilidades claras.

**Regras de ownership:**

| Store            | É dona de                                                          |
| ---------------- | ------------------------------------------------------------------ |
| `workspaceStore` | Caminho raiz, árvore `FileNode[]`, arquivo ativo (path)            |
| `editorStore`    | Conteúdo do editor, status de save, tipografia selecionada         |
| `uiStore`        | Modo foco, painel ativo (`editor` \| `dashboard`), sidebar visível |

**Comunicação entre stores:** Quando uma ação em uma store precisa afetar outra, isso acontece no componente ou hook que orquestra a operação — não dentro das stores.

```typescript
// Correto: orquestração no componente
const { setActiveFile } = useWorkspaceStore();
const { loadContent } = useEditorStore();

async function openFile(path: string) {
  const content = await readFile(path); // tauri-bridge
  setActiveFile(path); // workspaceStore
  loadContent(content); // editorStore
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
  --color-bg-base: #1c1f26; // fundo principal do app
  --color-bg-surface: #242830; // sidebar, cards, painéis elevados
  --color-bg-elevated: #2d3240; // modais, popovers, tooltips
  --color-bg-hover: #333848; // hover em itens de lista

  // Bordas
  --color-border: #3a3f52; // separadores e bordas sutis
  --color-border-strong: #4a5068; // bordas com mais contraste

  // Texto
  --color-text-primary: #e8eaf0; // texto principal
  --color-text-secondary: #9da3b8; // texto secundário, labels
  --color-text-muted: #616882; // placeholders, texto desabilitado

  // Acento — Amethyst
  --color-accent: #9b72f5; // cor principal de acento
  --color-accent-dim: #7c5acc; // acento mais escuro (hover, pressed)
  --color-accent-glow: rgba(155, 114, 245, 0.18); // glow/halo suave

  // Semânticas
  --color-danger: #e05c72; // erro, exclusão, link quebrado
  --color-success: #4caf7d; // save confirmado, sucesso
  --color-warning: #e0a45c; // avisos

  // WikiLinks
  --color-wikilink-active: var(--color-accent);
  --color-wikilink-broken: var(--color-danger);

  // Tipografia
  --font-sans: "Inter Variable", system-ui, sans-serif;
  --font-serif: "Lora", "Georgia", serif;
  --font-mono: "JetBrains Mono", monospace;

  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-md: 15px;
  --font-size-lg: 18px;
  --font-size-xl: 24px;

  --line-height-tight: 1.3;
  --line-height-body: 1.7; // essencial para conforto na escrita longa

  // Espaçamento
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 40px;

  // Layout
  --sidebar-width: 260px;
  --header-height: 48px;
  --statusbar-height: 28px;
  --editor-max-width: 720px; // largura máxima da coluna de texto (conforto de leitura)

  // Bordas e raios
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  // Sombras
  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.6);

  // Transições
  --transition-fast: 100ms ease;
  --transition-normal: 200ms ease;
}
```

**Uso em componente:**

```scss
// FileTree.module.scss
@use "@/shared/styles/variables" as *; // opcional — variáveis CSS já estão em :root

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

| Anti-pattern                                        | Por quê é proibido                                                |
| --------------------------------------------------- | ----------------------------------------------------------------- |
| `invoke()` direto em componente                     | Viola ADR-001                                                     |
| Store importando outra store                        | Viola ADR-002, cria dependência circular                          |
| Estilos inline (`style={{}}`) para layout           | Use SCSS Module                                                   |
| `useEffect` para sincronizar estado derivado        | Use seletores Zustand ou `useMemo`                                |
| `useEffect` para buscar dados em componente         | Inicialize nas actions da store (ver 6.7)                         |
| Lógica de negócio dentro de JSX                     | Extraia para hook customizado (ver 6.3)                           |
| Prop drilling com mais de 2 níveis                  | Use store Zustand                                                 |
| Componente com mais de ~200 linhas                  | Quebre em subcomponentes (ver 6.2)                                |
| Input do usuário concatenado em caminho sem validar | Sempre usar `isValidFileName` + `isPathWithinWorkspace` (ver 6.6) |
| Operação assíncrona sem estado de loading           | Sempre modelar `idle / loading / success / error` (ver 6.7)       |
| Feature sem Error Boundary                          | Envolver com `<ErrorBoundary>` em App.tsx (ver 6.5)               |

---

## 6. Padrões de Qualidade de Código

Esta seção define padrões obrigatórios de engenharia. Cada padrão tem exemplos concretos de uso correto e incorreto.

---

### 6.1 Atualizações Otimistas

**Princípio:** A UI responde imediatamente à ação do usuário. A operação no backend acontece em paralelo. Se falhar, a UI reverte e exibe o erro.

**Quando usar:** Toda operação de escrita que tem baixo risco de falha e alta frequência de uso — renomear arquivo, mover, criar nota, salvar conteúdo.

**Quando NÃO usar:** Operações destrutivas irreversíveis (excluir arquivo) — essas esperam confirmação do backend antes de atualizar a UI.

**Padrão obrigatório:**

```typescript
// hooks/useRenameFile.ts
export function useRenameFile() {
  const { renameNode } = useWorkspaceStore();
  const { showToast } = useUIStore();

  return async function renameFile(path: string, newName: string) {
    // 1. Snapshot do estado anterior para rollback
    const previousName = path.split("\\").pop() ?? "";

    // 2. Atualização otimista — UI responde imediatamente
    renameNode(path, newName);

    try {
      // 3. Operação real no backend
      await renameItem(path, newName); // tauri-bridge
    } catch (err) {
      // 4. Rollback em caso de falha
      renameNode(path, previousName);
      showToast({
        type: "error",
        message: "Não foi possível renomear o arquivo.",
      });
    }
  };
}
```

---

### 6.2 Hierarquia e Componentização

**Regras de quando quebrar um componente:**

| Situação                                   | Decisão                                                                |
| ------------------------------------------ | ---------------------------------------------------------------------- |
| Componente ultrapassa ~200 linhas          | Quebrar obrigatoriamente                                               |
| Mesmo bloco JSX repetido 2+ vezes          | Extrair para componente                                                |
| Lógica condicional complexa dentro do JSX  | Extrair para componente ou variável                                    |
| Componente tem mais de 5 props             | Avaliar se deve ser quebrado ou se props podem ser agrupadas em objeto |
| Bloco tem seu próprio estado local isolado | Extrair para componente próprio                                        |

**Hierarquia de responsabilidade:**

```
Page / Layout         → orquestra stores e hooks, sem lógica de UI
  ↓
Feature Component     → lógica de negócio da feature, usa hooks customizados
  ↓
UI Component          → puramente visual, recebe props, sem acesso a stores
  ↓
Shared/Primitives     → componentes genéricos reutilizáveis (Modal, Toast, Button)
```

**Regra:** Componentes de UI (folha da árvore) não acessam stores Zustand diretamente — recebem tudo via props. Apenas Feature Components e acima acessam stores.

```typescript
// CORRETO — UI Component puro
interface FileTreeItemProps {
  name: string;
  isActive: boolean;
  isDir: boolean;
  depth: number;
  onClick: () => void;
  onRename: (newName: string) => void;
}

export default function FileTreeItem({
  name,
  isActive,
  onClick,
}: FileTreeItemProps) {
  // Sem useWorkspaceStore aqui — só props
}

// CORRETO — Feature Component acessa store
export default function FileTree() {
  const { tree, activeFile } = useWorkspaceStore();
  const renameFile = useRenameFile(); // hook customizado
  // ...
}
```

---

### 6.3 Política de Hooks Customizados

**Criar um hook customizado quando:**

- A lógica envolve 2+ `useState` ou `useEffect` relacionados
- A mesma lógica é usada em 2+ componentes
- Uma operação envolve coordenação entre store + tauri-bridge
- A lógica tem efeitos colaterais (timers, event listeners, subscriptions)

**Nomenclatura obrigatória:**

| Tipo                | Padrão                   | Exemplo                                             |
| ------------------- | ------------------------ | --------------------------------------------------- |
| Ação sobre entidade | `use + Verbo + Entidade` | `useRenameFile`, `useCreateNote`, `useMoveItem`     |
| Estado derivado     | `use + Entidade + State` | `useEditorSaveState`, `useWorkspaceTree`            |
| Efeito/listener     | `use + Descrição`        | `useKeyboardShortcut`, `useAutoSave`, `useFileDrop` |

**Localização:**

- Hook específico de uma feature → `features/<feature>/hooks/`
- Hook genérico reutilizável → `shared/hooks/`

```typescript
// features/editor/hooks/useAutoSave.ts
export function useAutoSave(content: string, filePath: string | null) {
  const { setSaveStatus } = useEditorStore();
  const { showToast } = useUIStore();

  const debouncedSave = useDebounce(async (text: string, path: string) => {
    setSaveStatus("saving");
    try {
      await writeFile(path, text); // tauri-bridge
      setSaveStatus("saved");
    } catch {
      setSaveStatus("error");
      showToast({ type: "error", message: "Erro ao salvar automaticamente." });
    }
  }, 1500);

  useEffect(() => {
    if (filePath) debouncedSave(content, filePath);
  }, [content, filePath]);
}
```

---

### 6.4 Tratamento de Erros

**Classificação de erros:**

| Tipo                                               | Exemplos                                                            | Resposta na UI                                                   |
| -------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Crítico** — quebra o fluxo principal             | Workspace corrompido, arquivo não pode ser lido, falha de permissão | Modal de erro com mensagem clara e ação (ex: "Tentar novamente") |
| **Recuperável** — operação falhou mas app continua | Falha ao renomear, erro ao salvar, imagem não encontrada            | Toast discreto no canto inferior                                 |
| **Silencioso** — irrelevante para o usuário        | Log interno, métricas                                               | `console.error` apenas, sem UI                                   |

**Padrão de erro na tauri-bridge:**

```typescript
// Todos os erros do Rust chegam como string — tipar explicitamente
export class TauriBridgeError extends Error {
  constructor(
    message: string,
    public readonly command: string,
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "TauriBridgeError";
  }
}

export async function readFile(path: string): Promise<string> {
  try {
    return await invoke<string>("read_file", { path });
  } catch (err) {
    throw new TauriBridgeError(
      `Não foi possível ler o arquivo: ${path}`,
      "read_file",
      err,
    );
  }
}
```

**Padrão de Toast:**

```typescript
// uiStore.ts — estrutura do toast
interface Toast {
  id: string;
  type: "success" | "error" | "warning" | "info";
  message: string;
  durationMs?: number; // padrão: 4000
}
```

**Padrão de Modal de erro crítico:**

```typescript
// Usado para falhas que impedem o uso do app
showErrorModal({
  title: "Não foi possível abrir o workspace",
  message:
    "O diretório selecionado não pode ser lido. Verifique as permissões.",
  action: { label: "Selecionar outro diretório", onClick: openWorkspacePicker },
});
```

---

### 6.5 Error Boundaries

**Regra:** Todo módulo de feature é envolvido por um Error Boundary. Erros em uma feature não derrubam o app inteiro.

**Localização dos Error Boundaries:**

```
App.tsx
  ├── <ErrorBoundary fallback={<WorkspaceError />}>
  │     <FileTree />
  │   </ErrorBoundary>
  │
  └── <ErrorBoundary fallback={<EditorError />}>
        <Editor />
      </ErrorBoundary>
```

**Implementação padrão:**

```typescript
// shared/components/ErrorBoundary/ErrorBoundary.tsx
interface ErrorBoundaryProps {
  fallback: React.ReactNode;
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}
```

**Nota:** Error Boundaries ainda precisam ser class components em React 19 — é a única exceção à regra de componentes funcionais.

---

### 6.6 Segurança — Validação e Sanitização

**Princípio: validar no frontend, validar de novo no Rust.** O frontend não é camada de segurança — ele valida para UX. O Rust valida para segurança real.

**Validações obrigatórias antes de qualquer `invoke()`:**

```typescript
// shared/utils/validation.ts

/** Nomes de arquivo válidos — sem caracteres especiais do Windows/Unix */
export function isValidFileName(name: string): boolean {
  if (!name || name.trim().length === 0) return false;
  if (name.length > 255) return false;
  // Caracteres proibidos no Windows: \ / : * ? " < > |
  const forbidden = /[\\/:*?"<>|]/;
  return !forbidden.test(name);
}

/** Verifica que o caminho está dentro do workspace raiz (path traversal) */
export function isPathWithinWorkspace(
  filePath: string,
  workspaceRoot: string,
): boolean {
  const normalizedFile = filePath.replace(/\//g, "\\");
  const normalizedRoot = workspaceRoot.replace(/\//g, "\\");
  return normalizedFile.startsWith(normalizedRoot);
}

/** Conteúdo de nota — limite de tamanho razoável */
export function isValidNoteContent(content: string): boolean {
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  return new Blob([content]).size <= MAX_SIZE_BYTES;
}
```

**Uso obrigatório antes de operações de disco:**

```typescript
// Exemplo em useCreateNote.ts
export function useCreateNote() {
  return async function createNote(name: string, parentPath: string) {
    // Validação antes do invoke — nunca pular
    if (!isValidFileName(name)) {
      showToast({ type: "error", message: "Nome de arquivo inválido." });
      return;
    }
    if (!isPathWithinWorkspace(parentPath, workspaceRoot)) {
      // Isso nunca deveria acontecer — erro silencioso + log
      console.error("[Security] Path traversal attempt:", parentPath);
      return;
    }
    await createFile(`${parentPath}\\${name}.md`); // tauri-bridge
  };
}
```

**Path traversal — regra inegociável:** Nunca construa caminhos concatenando input do usuário diretamente. Sempre valide com `isPathWithinWorkspace` antes de qualquer operação de disco.

---

### 6.7 Padrões Modernos Gerais

**`async/await` sempre — nunca `.then().catch()` encadeado:**

```typescript
// CORRETO
const content = await readFile(path);

// PROIBIDO
readFile(path).then(content => { ... }).catch(err => { ... });
```

**Early return para reduzir nesting:**

```typescript
// CORRETO
async function openFile(path: string) {
  if (!path) return;
  if (!isPathWithinWorkspace(path, workspaceRoot)) return;

  const content = await readFile(path);
  loadContent(content);
}

// PROIBIDO — nesting desnecessário
async function openFile(path: string) {
  if (path) {
    if (isPathWithinWorkspace(path, workspaceRoot)) {
      const content = await readFile(path);
      loadContent(content);
    }
  }
}
```

**Estado de loading explícito em operações assíncronas:**

```typescript
// Toda operação assíncrona visível ao usuário tem três estados
type AsyncState<T> =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: string };
```

**Sem `useEffect` para buscar dados — use inicialização nas stores:**

```typescript
// PROIBIDO — busca de dados em useEffect de componente
useEffect(() => {
  listDirectory(rootPath).then(setTree);
}, [rootPath]);

### 6.9 Notas Estruturadas (Metadata Header)

**Princípio:** Notas podem conter metadados estruturados (YAML Frontmatter) que são convertidos em componentes visuais ricos no topo do editor.

**Implementação:**
- O bloco YAML é identificado no carregamento do arquivo.
- Uma extensão customizada (`MetadataHeader`) substitui o texto bruto por um `NodeView` React.
- A edição dos campos na interface visual sincroniza automaticamente com o conteúdo textual da nota para salvamento.

**Motivo:** Transforma arquivos de texto puro em "entidades" (ex: Personagens, Locais) com campos específicos e ícones, mantendo a compatibilidade com Markdown padrão.

```

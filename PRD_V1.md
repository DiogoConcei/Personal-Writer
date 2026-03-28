# PRD — Editor Híbrido (V1)
**Versão:** 1.1  
**Stack:** Tauri 2 · React 19 · TypeScript · TipTap 2 · Zustand · SCSS Modules · Rust  
**Objetivo:** Definir o escopo mínimo completo e verificável da primeira versão do editor.  
**Tema visual:** Amethyst + Gunmetal (tokens definidos em `ARCHITECTURE.md`)

---

## 1. Visão do Produto

Um editor de notas local-first para uso pessoal dual: estudo de Ciência da Computação e escrita criativa de ficção. O diferencial é ser um workspace de arquivos reais (`.md`) gerenciado por interface nativa, sem bancos de dados remotos ou sincronização em nuvem na V1.

**Usuário-alvo:** Uma única pessoa (uso pessoal). Sem multiusuário, sem autenticação, sem colaboração em tempo real.

---

## 2. Escopo da V1 — O que está DENTRO

As quatro features abaixo definem o que torna o produto utilizável. Cada uma tem critérios de aceitação verificáveis.

---

### Feature 1 — Editor Rich Text com Auto-Save

**Descrição:** O coração do produto. O usuário deve poder escrever e formatar texto com persistência automática confiável.

**Critérios de aceitação:**
- [ ] O editor renderiza e permite edição de arquivos `.md` existentes
- [ ] Suporte a formatação: **negrito**, *itálico*, `código inline`, ~~tachado~~
- [ ] Suporte a blocos: H1–H3, listas com marcadores, listas numeradas, blocos de código, citações
- [ ] Auto-save dispara após **1500ms** de inatividade desde a última alteração (debounced)
- [ ] Indicador visual de status de salvamento na barra de status: `Salvando…` / `Salvo às HH:MM` / `Erro ao salvar`
- [ ] Atalho manual `Ctrl+S` força save imediato, bypassando o debounce
- [ ] Nenhuma perda de dados em fechamento normal da janela (Tauri `on_close_requested` verifica save pendente)
- [ ] Alternância de tipografia: botão no header troca entre fonte Serif e Sans-Serif (persiste por sessão)

**Fora de escopo na V1:** LaTeX, Mermaid, Callouts, tabelas.

---

### Feature 2 — File Tree + Operações de Disco

**Descrição:** Sidebar com árvore hierárquica do workspace. O usuário abre um diretório raiz e navega, cria, renomeia e exclui itens.

**Critérios de aceitação:**
- [ ] Na primeira abertura, o app exibe um prompt para o usuário selecionar um diretório raiz (pasta do workspace)
- [ ] O workspace selecionado é persistido entre sessões (via `tauri-plugin-store` ou arquivo de config local)
- [ ] A sidebar exibe a árvore completa com distinção visual entre pastas e arquivos `.md`
- [ ] Arquivos não `.md` são listados mas não abríveis no editor (exibem mensagem de tipo não suportado)
- [ ] **Criar arquivo:** clique no ícone `+` na sidebar → input inline → confirmar com Enter cria `Nome.md` na pasta atual
- [ ] **Criar pasta:** mesma lógica com ícone de pasta
- [ ] **Renomear:** duplo clique no nome → input inline → confirmar com Enter
- [ ] **Excluir:** menu de contexto (right-click) → confirmação modal → exclusão permanente do disco
- [ ] **Colisão de nomes:** ao criar/renomear para um nome já existente, o sistema adiciona sufixo automático `(1)`, `(2)`, etc.
- [ ] **Mover:** drag-and-drop de arquivos entre pastas na sidebar
- [ ] Clicar em um arquivo `.md` abre-o no editor; o item fica destacado como ativo

**Fora de escopo na V1:** Importação de arquivos externos, multi-seleção, undo de exclusão.

---

### Feature 3 — WikiLinks (`[[Nota]]`)

**Descrição:** Extensão do TipTap que renderiza `[[Nome da Nota]]` como link clicável navegável dentro do workspace.

**Critérios de aceitação:**
- [ ] Digitar `[[` abre um popover de autocomplete listando os arquivos `.md` do workspace
- [ ] O autocomplete filtra em tempo real conforme o usuário digita após `[[`
- [ ] Selecionar um item no popover (ou pressionar Enter no primeiro resultado) insere o WikiLink formatado
- [ ] WikiLinks para arquivos existentes são renderizados com estilo de link ativo (ex: cor azul/acento)
- [ ] WikiLinks para arquivos inexistentes são renderizados com estilo de link quebrado (ex: cor vermelha/tracejado)
- [ ] Clicar em um WikiLink ativo navega para o arquivo correspondente no editor
- [ ] Clicar em um WikiLink quebrado cria o arquivo e navega para ele
- [ ] O WikiLink é salvo no arquivo `.md` como texto plano `[[Nome da Nota]]` (compatível com Obsidian)

**Fora de escopo na V1:** Grafo de conexões visual, backlinks sidebar.

---

### Feature 4 — Dashboard de Cards

**Descrição:** Visão alternativa ao editor — grade de cards com preview das notas do workspace.

**Critérios de aceitação:**
- [ ] Botão no header alterna entre `Modo Editor` e `Modo Dashboard`
- [ ] O dashboard exibe todas as notas `.md` do workspace como cards em grid responsivo
- [ ] Cada card exibe: nome do arquivo, primeiras ~150 caracteres de conteúdo (texto plano, sem markdown), e data da última modificação
- [ ] Clicar em um card abre o arquivo no editor e retorna ao Modo Editor automaticamente
- [ ] Cards são ordenados por data de modificação (mais recente primeiro) por padrão
- [ ] O dashboard é read-only — nenhuma edição acontece nele

**Fora de escopo na V1:** Galeria de imagens, snippets de código, filtros e ordenação customizável.

---

### Feature 5 — Imagens Inline

**Descrição:** O usuário pode inserir imagens de referência diretamente na nota durante a escrita — colando, arrastando ou via menu. As imagens são armazenadas localmente na pasta `/assets` do workspace para garantir portabilidade.

**Critérios de aceitação:**
- [ ] Inserir imagem por **colar** (`Ctrl+V` com imagem na área de transferência)
- [ ] Inserir imagem por **drag-and-drop** de arquivo do sistema operacional para o editor
- [ ] Inserir imagem via **menu Slash** (`/imagem` ou `/image`) → abre seletor de arquivo nativo
- [ ] Ao inserir, a imagem é automaticamente **copiada para `/assets/`** dentro do workspace (o `.md` referencia o caminho relativo)
- [ ] **Redimensionar:** handles de arrastar nos cantos da imagem para redimensionar proporcionalmente
- [ ] **Alinhamento:** toolbar contextual ao clicar na imagem com opções: esquerda · centro · direita
- [ ] **Float:** opções adicionais na toolbar: flutuar à esquerda (texto envolve pela direita) · flutuar à direita (texto envolve pela esquerda) · sem float
- [ ] **Visualização em tela cheia:** clique duplo na imagem abre overlay fullscreen; `Esc` fecha
- [ ] Imagens são salvas no `.md` como referência Markdown padrão: `![alt](./assets/nome.png)`
- [ ] Imagens com caminho quebrado (arquivo movido/deletado) exibem placeholder visual com mensagem de erro, sem quebrar o editor

**Fora de escopo na V1:** Galeria de assets separada, renomear/mover imagens pela UI, crop, filtros.

---



Estas se aplicam ao produto como um todo na V1:

| Feature | Critério |
|---|---|
| Modo Foco | `Ctrl+\` oculta sidebar e header; `Esc` ou mesmo atalho restaura |
| Busca rápida por nome | `Ctrl+F` abre input que filtra arquivos na sidebar por nome em tempo real |
| Breadcrumb | Header exibe caminho relativo do arquivo aberto (ex: `workspace / pasta / nota.md`) |
| Contador de palavras | Barra de status exibe contagem de palavras do arquivo aberto |
| Atalhos de teclado | `Ctrl+N` nova nota, `Ctrl+B` toggle sidebar |

---

## 4. O que está FORA do escopo da V1

Lista explícita para evitar scope creep durante o desenvolvimento:

- Callouts / Admonitions
- Grafo de conexões visual
- Mermaid.js / diagramas
- LaTeX / fórmulas matemáticas
- Busca por conteúdo interno das notas (full-text search)
- Drag-and-drop de arquivos externos para o workspace
- Snapshots / versionamento
- Flashcards / spaced repetition
- Templates
- Export para PDF
- Qualquer funcionalidade de IA/LLM integrada

---

## 5. Arquitetura de Estado (Zustand)

Definição prévia das stores para evitar inconsistências durante a geração de código:

```
useWorkspaceStore     → caminho do workspace raiz, árvore de arquivos
useEditorStore        → arquivo ativo, conteúdo, status de save, tipografia
useUIStore            → modo foco ativo, painel aberto (editor | dashboard), sidebar visível
```

Regra: componentes acessam apenas a store do seu domínio. Comunicação entre features via actions das stores, não via props drilling.

---

## 6. Contrato da Tauri Bridge

Todo `invoke()` do frontend passa pelo módulo `src/tauri-bridge/`. Comandos Rust previstos na V1:

```typescript
// src/tauri-bridge/index.ts (interface, não implementação)

read_file(path: string): Promise<string>
write_file(path: string, content: string): Promise<void>
list_directory(path: string): Promise<FileNode[]>
create_file(path: string): Promise<void>
create_directory(path: string): Promise<void>
rename_item(old_path: string, new_path: string): Promise<void>
delete_item(path: string): Promise<void>
move_item(source: string, destination: string): Promise<void>
search_files_by_name(workspace: string, query: string): Promise<string[]>
copy_image_to_assets(source_path: string, workspace: string): Promise<string> // retorna caminho relativo
```

```typescript
// Tipo compartilhado
interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
  children?: FileNode[];
  modified_at: number; // Unix timestamp
}
```

---

## 7. Critério de "Done" para a V1

A V1 está completa quando:

1. As **cinco features** acima passam em todos os critérios de aceitação
2. Não há `any` no código TypeScript
3. Todo `invoke()` está encapsulado no módulo `tauri-bridge`
4. O app abre, o usuário seleciona um workspace, cria uma nota, escreve, cola uma imagem, redimensiona e define o float, cria um WikiLink para outra nota, navega por WikiLink, e vê ambas as notas no Dashboard — **sem nenhum erro de console**
5. Build de produção (`tauri build`) executa sem warnings críticos

---

## 8. Decisões Técnicas Registradas

| Decisão | Escolha | Motivo |
|---|---|---|
| Framework UI | React 19 | Ecossistema, compatibilidade com TipTap |
| Editor | TipTap 2 | Extensível, headless, suporte a extensões customizadas |
| Estado global | Zustand | Simples, sem boilerplate, fácil de testar |
| Persistência de config | tauri-plugin-store | Nativo, sem dependência externa |
| Estilo | SCSS Modules | Escopo isolado por componente, sem runtime overhead, suporte a nesting e variáveis |
| Formato de nota | `.md` texto plano | Interoperabilidade com Obsidian, sem vendor lock-in |

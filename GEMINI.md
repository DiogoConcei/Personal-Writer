# GEMINI.md — Instruções de Projeto

> Este arquivo é lido automaticamente pelo Gemini CLI como contexto de sistema.
> Ele define as regras inegociáveis do projeto. Siga-as sem exceção.

---

## Identidade do Projeto

Você é um engenheiro sênior construindo um editor de notas desktop chamado **Editor Híbrido**.

**Stack obrigatória:**
- Frontend: React 19 + TypeScript + Vite
- Editor: TipTap 2
- Estado global: Zustand
- Estilo: SCSS Modules (sem Tailwind, sem styled-components, sem CSS-in-JS)
- Desktop: Tauri 2
- Backend: Rust (comandos Tauri)

---

## Regras Inegociáveis

Estas regras se aplicam a CADA linha de código que você escrever. Não há exceções.

### 1. Antes de escrever qualquer código
Liste os arquivos que vai criar ou modificar e aguarde confirmação explícita do usuário.  
Formato obrigatório:
```
Vou criar/modificar:
- src/features/editor/store/editorStore.ts  (novo)
- src/features/editor/components/Editor.tsx  (novo)
- src/app/App.tsx  (modificar)

Posso prosseguir?
```

### 2. Estrutura de pastas é sagrada
Use EXATAMENTE a estrutura definida em `ARCHITECTURE.md`. Não crie pastas fora do padrão (`utils/`, `helpers/`, `lib/`, `services/` são proibidas na raiz de `src/`). Se precisar de um novo local, justifique e proponha antes de criar.

### 3. Nenhum `invoke()` fora da tauri-bridge
Todo acesso ao backend Rust passa por funções exportadas em `src/tauri-bridge/`.  
Se você escrever `invoke(` em qualquer outro arquivo, está errado.

### 4. TypeScript estrito
- `any` é proibido. Sem exceções.
- Props de componentes: sempre `interface`, nunca `type` anônimo inline
- Retornos de função: sempre tipados explicitamente quando não-triviais
- O `tsconfig.json` deve ter `"strict": true`

### 5. SCSS Modules
- Cada componente tem seu `.module.scss` na mesma pasta
- Tokens de design (cores, espaçamento) vêm de variáveis CSS definidas em `src/shared/styles/_variables.scss`
- Nomenclatura de classes: BEM — `.bloco__elemento--modificador`
- Nenhum `style={{}}` inline para layout ou aparência

### 6. Zustand: uma store por domínio
- `workspaceStore`: caminho raiz, árvore de arquivos, arquivo ativo
- `editorStore`: conteúdo, status de save, tipografia
- `uiStore`: modo foco, painel ativo, sidebar visível
- Stores não importam umas às outras
- Orquestração entre stores acontece em hooks ou componentes

### 7. Componentes funcionais apenas
- Zero class components
- Hooks para toda lógica de estado local
- Componentes com mais de ~200 linhas devem ser quebrados

### 8. Escopo da V1
Implemente APENAS o que está descrito no `PRD_V1.md`. Se uma feature não está no PRD, não implemente — mesmo que pareça simples ou relacionada. Pergunte antes.

---

## Como Responder a Pedidos de Código

### Para pedidos pequenos (1–2 arquivos):
1. Liste os arquivos (regra 1)
2. Aguarde confirmação
3. Escreva o código completo do arquivo
4. Aponte explicitamente qualquer decisão não-óbvia que tomou

### Para pedidos grandes (feature completa):
1. Proponha um plano de implementação dividido em etapas
2. Aguarde aprovação do plano
3. Implemente uma etapa por vez
4. Ao fim de cada etapa, liste o que foi feito e o que vem a seguir

### Para dúvidas arquiteturais:
Consulte `ARCHITECTURE.md`. Se a resposta não estiver lá, proponha uma ADR antes de implementar.

---

## Contexto do Projeto

Leia os dois documentos abaixo antes de qualquer implementação:

- `PRD_V1.md` — escopo, critérios de aceitação, o que está fora da V1
- `ARCHITECTURE.md` — estrutura de pastas, ADRs, convenções, anti-patterns

---

## Ordem de Implementação Recomendada

Siga esta sequência. Não pule etapas.

```
Etapa 1 — Scaffold
  - Criar projeto Tauri 2 + React 19 + TypeScript
  - Configurar tsconfig.json (strict mode)
  - Configurar path alias @/ apontando para src/
  - Instalar dependências: tiptap, zustand, sass
  - Criar estrutura de pastas conforme ARCHITECTURE.md
  - Criar src/shared/styles/_variables.scss com todos os tokens

Etapa 2 — Tauri Bridge
  - Criar src/tauri-bridge/types.ts (FileNode e demais tipos)
  - Criar src/tauri-bridge/fs.ts (wrappers para comandos Rust)
  - Criar src/tauri-bridge/index.ts (re-exporta tudo)
  - Implementar comandos Rust correspondentes em src-tauri/src/commands/fs.rs
  - Registrar comandos em lib.rs

Etapa 3 — Workspace Store + File Tree
  - Criar workspaceStore.ts
  - Criar FileTree.tsx + FileTreeItem.tsx
  - Implementar: abrir workspace, listar arquivos, criar, renomear, excluir
  - Implementar drag-and-drop para mover arquivos

Etapa 4 — Editor Store + Editor
  - Criar editorStore.ts
  - Criar Editor.tsx com TipTap básico
  - Implementar auto-save com debounce de 1500ms
  - Criar StatusBar.tsx (palavras, status de save)

Etapa 5 — WikiLinks
  - Criar extensão WikiLink em features/editor/extensions/WikiLink/
  - Implementar popover de autocomplete ao digitar [[
  - Implementar navegação por clique (ativo) e criação de nota (quebrado)

Etapa 6 — Imagens Inline
  - Criar extensão Image em features/editor/extensions/Image/
  - Implementar inserção por colar (Ctrl+V), drag-and-drop e menu Slash
  - Implementar comando Rust copy_image_to_assets em src-tauri/src/commands/fs.rs
  - Implementar NodeView com handles de resize proporcional
  - Implementar ImageToolbar: alinhamento (esquerda/centro/direita) e float (left/right/none)
  - Implementar ImageFullscreen: overlay com Esc para fechar
  - Implementar placeholder visual para imagens com caminho quebrado

Etapa 7 — Dashboard
  - Criar Dashboard.tsx + NoteCard.tsx
  - Ler lista de notas de workspaceStore
  - Implementar toggle Editor ↔ Dashboard no header

Etapa 8 — UI Global
  - Criar uiStore.ts
  - Implementar Modo Foco (Ctrl+\)
  - Implementar Breadcrumb no header
  - Implementar busca por nome (Ctrl+F)
  - Implementar todos os atalhos de teclado do PRD
```

---

## Regras Adicionais — Backend Rust

9. Nunca gere código Rust sem antes mostrar o diff exato do que vai mudar e aguardar confirmação
10. Para cada novo comando Tauri, descreva em português o que ele faz, quais parâmetros recebe e o que retorna — antes de escrever o código
11. Nunca use crates que não estejam listadas no Cargo.toml atual — se precisar de uma nova, proponha a adição separadamente e aguarde aprovação
12. Depois de qualquer mudança em `src-tauri/`, instrua explicitamente a rodar `npm run tauri dev` e aguarde confirmação de que compilou antes de continuar
13. O scaffold Tauri SEMPRE inclui a geração de ícones como parte obrigatória da Etapa 1, rodando `npm run tauri icon <caminho-do-png>` — nunca entregue um scaffold sem ícones gerados

---

## Checklist de Qualidade (antes de entregar qualquer código)

- [ ] Nenhum `invoke()` fora de `src/tauri-bridge/`
- [ ] Nenhum `any` no TypeScript
- [ ] Todos os arquivos estão na pasta correta conforme `ARCHITECTURE.md`
- [ ] Props tipadas com `interface`
- [ ] Estilos em `.module.scss`, não inline
- [ ] Classes SCSS seguem BEM
- [ ] Nenhuma feature fora do escopo do `PRD_V1.md` foi implementada
- [ ] Se houve qualquer mudança em `src-tauri/`, o `npm run tauri dev` foi rodado e confirmou compilação bem-sucedida
- [ ] Se é scaffold (Etapa 1), os ícones foram gerados via `npm run tauri icon`
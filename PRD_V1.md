# PRD — Editor Híbrido (V1)
**Versão:** 1.3 (Atualizado com Refatorações de Extensão e WikiLinks)  
**Stack:** Tauri 2 · React 19 · TypeScript · TipTap 2 · Zustand · SCSS Modules · Rust  
**Objetivo:** Definir o escopo mínimo completo e verificar o progresso real.

---

## 1. Visão do Produto
Um editor de notas local-first para uso pessoal dual: estudo de Ciência da Computação e escrita criativa de ficção. Gerenciamento de arquivos reais (`.md`) com metadados YAML.

---

## 2. Status das Features da V1

### Feature 1 — Editor Rich Text com Auto-Save
**Status:** 🟢 **Concluído**
- [x] Renderização e edição de arquivos `.md` (Padronização concluída)
- [x] Suporte a formatação básica (Negrito, Itálico, Listas via StarterKit)
- [x] **Auto-save:** Dispara após 1500ms de inatividade (`Editor.tsx`)
- [x] **Atalho manual:** `Ctrl+S` força save e cria snapshot
- [x] **Tipografia:** Alternância entre Sans e Serif no header

### Feature 2 — File Tree + Operações de Disco
**Status:** 🟢 **Concluído**
- [x] Seleção de diretório raiz
- [x] Árvore hierárquica com distinção entre pastas e arquivos
- [x] **Limpeza de Sidebar:** Pastas/arquivos ocultos (iniciados com `.`) são filtrados automaticamente
- [x] Criar, Renomear e Excluir arquivos/pastas (Unificado para `.md`)
- [x] Persistência do workspace entre sessões

### Feature 3 — WikiLinks (`[[Nota]]`)
**Status:** 🟢 **Concluído (Refatorado)**
- [x] **Arquitetura de Node:** Implementado como *Inline Atom Node* em vez de decoração de texto, garantindo estabilidade absoluta contra duplicação de caracteres.
- [x] **Visibilidade Inteligente:** Colchetes `[[` e `]]` ficam ocultos por padrão e só aparecem quando o link está selecionado/focado.
- [x] Autocomplete ao digitar `[[` filtrando arquivos `.md` do workspace.
- [x] Renderização visual diferenciada para links existentes (Acento) vs. quebrados (Danger/Dotted).
- [x] Navegação por clique (abre nota existente ou cria nova se estiver quebrada).

### Feature 4 — Dashboard de Cards
**Status:** 🟢 **Concluído**
- [x] Alternância entre Modo Editor e Modo Dashboard
- [x] Grid de cards com ordenação por `modified_at` (mais recente primeiro)
- [x] Filtro automático de arquivos `.md`

### Feature 5 — Imagens Inline
**Status:** 🟡 **Parcial**
- [x] Inserção por Drag-and-drop de arquivos do SO
- [x] Cópia automática para a pasta `/assets/` do workspace via Rust
- [ ] Handles de resize proporcional (precisa validar UI do `ImageNode.tsx`)
- [ ] Toolbar contextual para alinhamento e float

---

## 3. Funcionalidades "Bônus" (Já Implementadas)

### Feature 6 — Sistema de Templates
- [x] Três modelos padrão: Ficha de Personagem, Capítulo e Worldbuilding
- [x] Uso de **YAML Frontmatter** para atributos (Nome, Idade, Classe, etc.)
- [x] Botão "Modelo" no Editor para aplicação rápida
- [x] Suporte a templates na criação de novos arquivos pela FileTree

### Feature 7 — Histórico de Versões (Snapshots)
- [x] Backend Rust para salvar snapshots datados em `.snapshots/`
- [x] Interface lateral para visualizar e restaurar versões anteriores
- [x] Criação automática de snapshot ao salvar manualmente (`Ctrl+S`)

### Feature 8 — Sidebar de Referências
- [x] Painel lateral para visualização de metadados YAML (Draft funcional)

---

## 4. UI Global e UX
- [x] **Breadcrumb:** Exibe o caminho do arquivo no header
- [x] **Contador de palavras:** Exibido na StatusBar
- [x] **Atalhos de Teclado:** Implementação de Ctrl+S e Ctrl+\ (Foco)

---

## 5. Próximos Passos Imediatos

1.  **Evolução da Ficha de Personagem:** Transformar a `ReferenceSidebar` em uma interface que permite editar os atributos YAML do frontmatter de forma visual (inputs organizados em vez de texto puro).
2.  **Refinamento de Imagens:** Implementar a toolbar de alinhamento/float.
3.  **Busca Full-text:** Implementar busca pelo conteúdo interno das notas (V2).

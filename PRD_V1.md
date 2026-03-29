# PRD — Editor Híbrido (V1)
**Versão:** 1.4 (Notas Estruturadas e Imagens Refinadas)  
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
- [x] **Persistência:** O último workspace aberto é carregado automaticamente ao iniciar o app.

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
- [x] **Visualização de Entidades:** Cards mostram Ícone (Foto/Emoji) e atributos YAML (ex: Nível, Classe) para notas de personagens ou locais.
- [x] **Layout Fluido:** O dashboard e o editor se adaptam automaticamente à largura da tela.

### Feature 5 — Imagens Inline
**Status:** 🟢 **Concluído**
- [x] Inserção por Drag-and-drop e Paste (Ctrl+V) com cópia automática para `/assets/`
- [x] **Redimensionamento Proporcional:** Handles nos 4 cantos com preservação de aspecto.
- [x] **Layout Google Docs:** Opções de Inline, Wrap-Left e Wrap-Right para fluidez do texto ao redor da imagem.
- [x] **Toolbar de Imagem:** Alinhamento, layout e modo tela cheia.
- [x] Placeholder visual para imagens com caminho quebrado.

---

## 3. Funcionalidades "Bônus" (Já Implementadas)

### Feature 6 — Notas Estruturadas (Metadata Header)
**Status:** 🟢 **Concluído**
- [x] **Cabeçalho Visual:** Metadados YAML transformados em interface visual no topo da nota.
- [x] **Identidade Visual:** Suporte a ícones grandes (Emoji ou Imagens Locais).
- [x] **Edição Dinâmica:** Adição e remoção de campos customizados direto no cabeçalho.
- [x] Sincronização automática entre cabeçalho visual e arquivo Markdown.

### Feature 7 — Histórico de Versões (Snapshots)
**Status:** 🟢 **Concluído**
- [x] Backend Rust para salvar snapshots datados em `.snapshots/`
- [x] Interface lateral para visualizar e restaurar versões anteriores
- [x] **Preview Realista:** Visualização das versões usa o mesmo motor do editor (TipTap) em modo leitura.
- [x] **Snapshots de Segurança:** Criação automática de snapshot ao restaurar uma versão antiga, evitando perda do trabalho atual.
- [x] **Gestão de Espaço:** Possibilidade de excluir versões individuais do histórico.

### Feature 8 — Sidebar de Referências
- [x] Painel lateral para visualização de metadados YAML (Draft funcional)

### Feature 9 — Layout "Zen" e Foco
- [x] **Esconder Sidebar:** Alternância via ícone no header ou atalho `Ctrl + \`.
- [x] **Escrita Infinita:** Área de escrita ocupa 100% da largura e altura disponível, permitindo cliques em qualquer ponto para focar.
- [x] **Zero Distrações:** Remoção de outlines, bordas e elementos de foco agressivos durante a escrita.

---

## 4. UI Global e UX
- [x] **Breadcrumb:** Exibe o caminho do arquivo no header.
- [x] **Contador de palavras:** Exibido na StatusBar.
- [x] **Atalhos de Teclado:** Implementação de `Ctrl + S` (Save/Snapshot) e `Ctrl + \` (Toggle Sidebar).

---

## 5. Próximos Passos Imediatos

1.  **Busca por Nome (Ctrl + F):** Implementar modal de busca rápida para navegar entre notas pelo nome do arquivo.
2.  **Breadcrumbs Interativos:** Permitir clicar nos níveis do caminho para navegar até as pastas.
3.  **Refinamento Final de Estilo:** Ajustes de espaçamento e consistência de cores.

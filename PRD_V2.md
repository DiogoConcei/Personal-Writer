# PRD — O Ateliê (V2.0: Produtividade e Exportação)

**Versão:** 2.0  
**Foco:** Escrita Profissional e Finalização de Manuscrito  
**Status:** Planejado

---

## 1. Visão Geral
Transformar o editor em uma estação de trabalho literária completa, focada em bater metas de escrita e gerar arquivos prontos para publicação ou submissão.

---

## 2. Features Principais

### Feature 1 — Metas de Escrita Profissionais ✅
**Objetivo:** Gamificação e controle de produtividade.
- **Configuração:** Meta por Sessão (ex: 500 palavras) e Meta por Capítulo/Arquivo. ✅
- **UI:** Barras de progresso discretas e elegantes no StatusBar. ✅
- **Persistência:** Salvas automaticamente no YAML da nota. ✅

### Feature 2 — Exportação Literária (PDF/DOCX)
**Objetivo:** Gerar arquivos limpos para leitura externa ou editoras.
- **Templates:** Manuscrito Padrão (Times New Roman, Fonte 12, Espaçamento Duplo).
- **Foco:** Simplicidade e legibilidade literária (Sem LaTeX).

### Feature 3 — Modo Foco V2 (Zen Mode) ✅
**Objetivo:** Imersão total na escrita.
- **Mecânica:** Atalho `Ctrl + \` que oculta Sidebar, Headers e Dashboard, mantendo apenas a "folha" de papel digital. ✅

### Feature 4 — Otimização do Revisor (Performance & UX) ✅
**Objetivo:** Refinar o corretor ortográfico da V2.1 para torná-lo profissional e sem fricção.
- **Performance Real-Time:** Reduzir debounce para 150ms no nó ativo. ✅
- **Acentuação Brasileira:** Motor Rust (`Spellbook`) validado. ✅
- **Conflito de UI (Menus):** Bubble Menu ocultado automaticamente sobre erros ortográficos. ✅
- **Estabilidade:** Integrado via TipTap Storage para evitar bugs de recarregamento do React. ✅
- **Heurística de Sugestão:** Implementado motor híbrido (Edições + Fonética) para resolver falhas do Hunspell nativo (ex: "axabacate"). ✅

### Feature 5 — Motor de Indexação SQLite (Universo & Metas)
**Objetivo:** Eliminar o gargalo de leitura de arquivos físicos para operações de busca, dashboard e métricas.
- **Arquitetura:** O SQLite funcionará como um **Cache de Índices de Alta Performance**. Os arquivos `.md` continuam sendo a fonte da verdade.
- **Indexação Automática:** O Rust monitora mudanças no workspace e extrai metadados (YAML), backlinks e contagem de palavras para o banco de dados.
- **Dashboard Instantâneo:** O Dashboard e a Timeline consultam o SQLite em vez de fazer parse de centenas de arquivos em tempo real.
- **Histórico de Metas:** Persistir o progresso diário de escrita (palavras por dia) para visualização de gráficos de produtividade.

---

## 3. Decisões Arquiteturais da V2
- **Banco de Dados:** Utilização da crate `rusqlite` no Rust para gerenciar um arquivo `.db` local no diretório de dados do aplicativo.
- **Sincronia:** O banco de dados é reconstruído ou atualizado sempre que o workspace é aberto ou um arquivo é salvo (via `save` na `editorStore`).
- **Comandos Tauri:** Todas as consultas pesadas de "Universo" (filtros por tipo, status, data) migram para comandos SQL no backend.

---

## 4. Fora de Escopo nesta versão
- Exportação LaTeX (Removido)
- Colaboração em tempo real (V4)
- Sincronização em Nuvem (V3)

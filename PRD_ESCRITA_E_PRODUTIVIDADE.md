# PRD — Escrita e Produtividade

**Foco:** Ferramentas para fluxo de escrita profissional, organização de metas e auxílio no aprendizado.

---

## Features Principais

### Feature 1 — Metas de Escrita Profissionais
**Objetivo:** Gamificação e controle de produtividade.
- **Configuração:** Meta por Sessão (ex: 500 palavras) e Meta por Capítulo/Arquivo.
- **UI:** Barras de progresso discretas e elegantes no StatusBar.
- **Persistência:** Salvas automaticamente no YAML da nota.

### Feature 2 — Exportação Literária e Templates
**Objetivo:** Gerar arquivos prontos para publicação ou submissão.
- **Formatos:** PDF e DOCX (Manuscrito Padrão: Times New Roman, Fonte 12, Espaçamento Duplo).
- **Templates:** Sistema de modelos (Personagem, Local, Capítulos) para padronização de metadados.

### Feature 3 — Modo Foco V2 (Zen Mode)
**Objetivo:** Imersão total na escrita.
- **Mecânica:** Atalho `Ctrl + \` que oculta Sidebar, Headers e Dashboard, mantendo apenas a "folha" de papel digital.

### Feature 4 — Otimização do Revisor (Performance & UX)
**Objetivo:** Corretor ortográfico profissional e sem fricção.
- **Performance Real-Time:** Reduzir debounce para 150ms no nó ativo.
- **Heurística de Sugestão:** Motor híbrido (Edições + Fonética) para resolver falhas do Hunspell nativo.

### Feature 5 — Flashcards Integrados (Spaced Repetition)
**Objetivo:** Auxiliar na memorização de conceitos, nomes de personagens ou worldbuilding.
- **Mecânica:** Marcar blocos de texto como "Flashcard".
- **Sistema:** Algoritmo SRS (estilo Anki) para gerenciar revisões diárias.

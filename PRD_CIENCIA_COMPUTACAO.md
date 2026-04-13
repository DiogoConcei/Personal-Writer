# PRD — Ciência da Computação

**Foco:** Execução de código, rigor técnico e ferramentas acadêmicas.

---

## Features Principais

### Feature 1 — Sandboxes de Execução (WASM)
**Objetivo:** Rodar código (C, Rust, JS) com segurança dentro da nota.
- **Mecânica:** Blocos de código com execução isolada em WebAssembly.
- **Output:** Painel de console integrado.

### Feature 2 — Advanced Code Blocks
**Objetivo:** Suporte a linguagens de script para análise de dados.
- **Integração:** Uso de Pyodide (Python em WASM) e renderização de gráficos básicos.

### Feature 3 — Analisador de Complexidade (Big O)
**Objetivo:** Identificação teórica de complexidade algorítmica.
- **Funcionalidade:** Análise estática de loops e recursão para sugerir o Big O (ex: O(n log n)).

### Feature 4 — LaTeX Math Avançado
**Objetivo:** Suporte completo a fórmulas complexas.
- **Renderização:** Integração total com KaTeX para macros personalizadas e equações numeradas.

### Feature 5 — Terminal Integrado
**Objetivo:** Acesso rápido ao sistema operacional sem sair do app.
- **Interface:** Painel (Drawer) com terminal funcional conectado ao shell nativo (PowerShell/Zsh).

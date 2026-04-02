# PRD — O Laboratório (V5: Ciência da Computação)

**Versão:** 5.0  
**Foco:** Execução de Código, Algoritmos e Rigor Técnico  
**Stack Base:** WASM Runtime (Wasmtime/Wasmer) · KaTeX · Monaco Editor Blocks

---

## 1. Visão Geral
Transformar o Editor Híbrido no ambiente definitivo para estudantes de Ciência da Computação, permitindo que a documentação teórica e a prática técnica (execução de código) coexistam no mesmo arquivo.

---

## 2. Features Planejadas

### Feature 1 — Sandboxes de Execução (WASM)
**Objetivo:** Rodar código de linguagens como C, Rust e JS diretamente na nota.
- **Mecânica:** Blocos de código com botão "Run". O código é compilado/executado em um ambiente isolado (Sandbox) via WebAssembly.
- **Output:** Painel de console integrado abaixo do bloco de código.

### Feature 2 — Advanced Code Blocks (Python/JS)
**Objetivo:** Suporte a scripts rápidos para análise de dados ou prototipagem.
- **Integração:** Utilização de Pyodide (Python em WASM) para rodar scripts Python sem necessidade de instalação local do interpretador.
- **Visualização:** Suporte a renderização de gráficos simples a partir do código.

### Feature 3 — Analisador de Complexidade (Big O)
**Objetivo:** Ferramenta educacional para análise de algoritmos.
- **Funcionalidade:** O usuário seleciona um bloco de código e solicita uma análise de complexidade.
- **Engine (Rust):** Análise estática básica (identificação de loops aninhados, recursão) para sugerir a complexidade teórica (ex: O(n²)).

### Feature 4 — LaTeX Math Avançado
**Objetivo:** Suporte a fórmulas complexas de cálculo e teoria.
- **Renderização:** Integração total com KaTeX para macros personalizadas e blocos de equações numeradas.
- **UI:** Preview em tempo real ao digitar sintaxe LaTeX.

### Feature 5 — Flashcards Integrados (Spaced Repetition)
**Objetivo:** Auxiliar na memorização de conceitos técnicos e sintaxe.
- **Mecânica:** Marcar blocos de texto ou código como "Flashcard".
- **Sistema:** Algoritmo SRS (estilo Anki) implementado no Rust para gerenciar revisões diárias.

### Feature 6 — Terminal Integrado (Tauri Shell)
**Objetivo:** Acesso rápido ao sistema sem sair do contexto da nota.
- **Interface:** Painel expansível (Drawer) com um terminal funcional conectado ao shell do SO (PowerShell/Zsh).

---

## 3. Requisitos Técnicos e Arquitetura

1.  **Isolamento de Segurança:** Toda execução de código de terceiros DEVE ser feita em sandboxes WASM estritas para evitar acesso não autorizado ao sistema de arquivos do usuário.
2.  **Shared Memory:** Uso de `SharedArrayBuffer` para comunicação eficiente entre o thread de execução (WASM) e a UI.
3.  **Rust Syntax Analysis:** Uso de crates como `syn` (para Rust) ou parsers de árvore (tree-sitter) para análise de complexidade algorítmica.

---

## 4. Critérios de Aceitação
- [ ] Execução de Hello World em JS/Python deve levar menos de 200ms para iniciar.
- [ ] O editor não deve travar durante a execução de scripts pesados (uso de Workers).
- [ ] Suporte completo a todas as macros padrão do LaTeX (Cálculo e Álgebra).

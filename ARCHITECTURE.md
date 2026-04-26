# ARCHITECTURE.md — Editor Híbrido

**Versão:** 1.5 (Refatoração Modular)
**Stack:** Tauri 2 · React 19 · TypeScript · TipTap 3 · Zustand · SCSS Modules · Rust

---

### 1. Estrutura de Pastas (Domínios de Feature)

O projeto adota uma arquitetura modular baseada em domínios funcionais para garantir baixo acoplamento e alta escalabilidade.

```
src/
├── features/
│   ├── canvas/         # Motor de Infinite Canvas e orquestração espacial
│   ├── docsview/       # Visualização e gestão de documentos PDF
│   ├── imageview/      # Galeria de ativos e gerenciamento de imagens
│   ├── universe/       # Dados do mundo (Personagens, Mural, Timeline)
│   ├── editor/         # Núcleo do processador de texto (TipTap)
│   ├── SlashMenu/      # Orquestrador de comandos barra (/) e modais
│   └── dashboard/      # Resumo e visão geral do projeto
├── shared/
│   ├── types/          # Sistema de tipagem centralizado por domínio
│   ├── hooks/          # Lógicas compartilhadas (DND, Icons, Zoom)
│   └── components/     # UI Kit comum (Modais, Toasts)
```

---

## Mapa de Saúde Arquitetural

| Feature | Responsabilidade | Status |
| :--- | :--- | :--- |
| **Canvas** | Orquestração de entidades no espaço infinito | ✅ Modularizado |
| **Editor** | Processamento de texto e metadados YAML | ✅ Categorizado (Core/Headers/Insights) |
| **SlashMenu** | Interface de comandos e inserção de mídia | ✅ Desacoplado |
| **Gallery Systems** | Visualização de Imagens e PDFs | ✅ Dividido (imageview / docsview) |
| **Type System** | Interfaces globais em `src/shared/types/` | ✅ Centralizado |

---

## 2. Decisões Arquiteturais Recentes (ADRs)

### ADR-017 — Centralização de Tipos (Domain Driven Types)
**Decisão:** Mover todas as interfaces de props e modelos de dados para `src/shared/types/`, divididos por arquivos de domínio (`assets.ts`, `universe.ts`, etc).
**Motivo:** Evitar dependências circulares entre componentes e fornecer uma "Single Source of Truth" para a estrutura de dados do projeto, facilitando a manutenção de contratos entre Backend (Rust) e Frontend.

### ADR-018 — Modularização de God Components
**Decisão:** Componentes com mais de 300 linhas devem ser subdivididos em sub-componentes atômicos e hooks de lógica.
**Motivo:** O `InfiniteCanvas` e o `Editor` atingiram níveis críticos de complexidade. A extração para pastas como `Core/`, `Headers/` e `hooks/` especializados reduziu a carga cognitiva e melhorou a performance de renderização.

### ADR-019 — Semântica de Visualização (Gallery vs Docs)
**Decisão:** Separar o gerenciamento de mídias em `imageview` e `docsview`.
**Motivo:** Embora ambos lidem com arquivos, o comportamento de interação (Thumbnails de PDF vs Galeria de Imagens) é distinto. A separação permite otimizações específicas (como PDF.js) sem inflar a lógica de imagens.

---

## 3. Padrões de Componentização

Todo novo componente deve seguir o padrão:
1.  **Pasta Própria:** `components/NomeComponente/`
2.  **Arquivos Atômicos:** `NomeComponente.tsx` e `NomeComponente.module.scss`.
3.  **Tipagem:** Props importadas de `@/shared/types`.
4.  **Lógica:** Extraída para hooks caso envolva cálculos complexos ou estado global.

---

## 4. UI Global e UX
- **Foco Total:** Ao entrar em painéis de visualização (Canvas, Galerias, Dashboard), a sidebar esquerda é fechada automaticamente para maximizar o espaço útil.
- **Identidade Visual:** Uso consistente da cor de acento (Amethyst) e tipografia serifada para leitura confortável.

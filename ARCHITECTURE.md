# ARCHITECTURE.md — Editor Híbrido

**Versão:** 1.6 (Saneamento e Unificação)
**Stack:** Tauri 2 · React 19 · TypeScript · TipTap 3 · Zustand · SCSS Modules · Rust

---

### 1. Estrutura de Pastas (Domínios de Feature)

O projeto adota uma arquitetura modular baseada em domínios funcionais para garantir baixo acoplamento e alta escalabilidade.

```
src/
├── features/
│   ├── canvas/         # Motor de Infinite Canvas e orquestração espacial
│   ├── docsview/       # Visualização e gestão de documentos PDF
│   ├── imageview/      # Galeria de ativos e gerenciamento de imagens (AssetGallery)
│   ├── universe/       # Dados do mundo (Personagens, Mural, Timeline)
│   ├── editor/         # Núcleo do processador de texto (TipTap)
│   ├── SlashMenu/      # Orquestrador de comandos barra (/) e inserção de mídia
│   ├── dashboard/      # Resumo e visão geral do projeto
│   ├── workspace/      # Gestão de arquivos, árvore de diretórios e sistema
│   ├── settings/       # Configurações do aplicativo e plugins
│   ├── search/         # Motor de busca global e indexação
│   └── templates/      # Sistema de modelos de notas e estruturas YAML
├── shared/
│   ├── types/          # Sistema de tipagem centralizado por domínio (ADR-017)
│   ├── hooks/          # Lógicas compartilhadas (DND, Icons, Zoom, Manager)
│   ├── components/     # UI Kit comum (Modais, Toasts, Base de Canvas)
│   └── utils/          # Funções puras e auxiliares de sistema
```

---

## Mapa de Saúde Arquitetural

| Feature | Responsabilidade | Status |
| :--- | :--- | :--- |
| **Canvas** | Orquestração de entidades no espaço infinito | ✅ Modularizado |
| **Editor** | Processamento de texto e metadados YAML | ✅ Categorizado (Core/Headers/Insights) |
| **SlashMenu** | Interface de comandos e inserção de mídia | ✅ Desacoplado |
| **Gallery Systems** | Visualização de Imagens e PDFs | ✅ Unificado (imageview como Core) |
| **Type System** | Interfaces globais em `src/shared/types/` | ✅ Centralizado (Zero Any Policy) |
| **Workspace** | Persistência e File System | ✅ Integrado com Tauri Bridge |

---

## 2. Decisões Arquiteturais Recentes (ADRs)

### ADR-017 — Centralização de Tipos (Domain Driven Types)
**Decisão:** Mover todas as interfaces de props e modelos de dados para `src/shared/types/`, divididos por arquivos de domínio (`assets.ts`, `universe.ts`, `slash-menu.ts`, etc).
**Motivo:** Evitar dependências circulares entre componentes e fornecer uma "Single Source of Truth" para a estrutura de dados. O uso de `any` é proibido, devendo-se utilizar tipagem forte ou `unknown` com narrowing.

### ADR-018 — Modularização de God Components
**Decisão:** Componentes com mais de 300 linhas devem ser subdivididos em sub-componentes atômicos e hooks de lógica.
**Motivo:** Reduzir carga cognitiva e melhorar performance. O `ImageGallery` foi refatorado de ~335 linhas para um wrapper conciso de ~30 linhas através da unificação.

### ADR-019 — Unificação Semântica de Galerias
**Decisão:** O domínio `imageview` (AssetGallery) torna-se o motor único para seleção e visualização de mídias.
**Motivo:** Evitar divergência de comportamento entre o SlashMenu e a Galeria principal. O componente agora suporta `pickerMode` para casos de uso de seleção rápida sem duplicar lógica de DND ou filtros.

---

## 3. Padrões de Componentização

Todo novo componente deve seguir o padrão:
1.  **Pasta Própria:** `components/NomeComponente/`
2.  **Arquivos Atômicos:** `NomeComponente.tsx` e `NomeComponente.module.scss`.
3.  **Tipagem:** Props importadas exclusivamente de `@/shared/types`.
4.  **Lógica:** Extraída para hooks caso envolva cálculos complexos ou estado global.

---

## 4. UI Global e UX
- **Foco Total:** Ao entrar em painéis de visualização (Canvas, Galerias, Dashboard), a sidebar esquerda é fechada automaticamente para maximizar o espaço útil.
- **Consistência de Espaçamento:** Galerias e grids devem manter um padding interno de `2rem` para garantir respiro visual e alinhamento com cabeçalhos.

---

### 5. Metodologia de Construção: O Caminho da Dependência

A ordem de refatoração ou de construção segue o fluxo do **Código Puro** para a **Interface Visual**.

#### 1. Tipagem Centralizada (A Fundação)
*   **Ação:** Definir interfaces em `src/shared/types/`.
*   **Razão:** Evita a propagação de `any` e garante que o contrato de dados seja a única fonte de verdade.

#### 2. Utils e Lógica Pura (O Motor Invisível)
*   **Ação:** Extrair cálculos, formatações e regras de negócio para arquivos `.ts`.
*   **Razão:** Isola a lógica do React, facilitando testes e manutenção.

#### 3. Custom Hooks (A Ponte com o React)
*   **Ação:** Conectar Utils ao ciclo de vida (useState, useEffect).
*   **Razão:** Atuam como maestros que orquestram a lógica para o consumo da interface.

#### 4. Seletores do Zustand (Otimização de Estado)
*   **Ação:** Criar acessos granulares e otimizados às stores globais.
*   **Razão:** Minimiza re-renderizações desnecessárias.

#### 5. Composição de Componentes (A Interface)
*   **Ação:** Implementar o JSX utilizando Compound Components.
*   **Razão:** A interface deve ser "burra", apenas declarando visualmente o que os hooks e tipos estruturaram.

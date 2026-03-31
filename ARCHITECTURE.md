# ARCHITECTURE.md — Editor Híbrido

**Versão:** 1.1  
**Stack:** Tauri 2 · React 19 · TypeScript · TipTap 3 · Zustand · SCSS Modules · Rust

---

## 1. Estrutura de Pastas (Novas Features)

```
├── src/
│   ├── features/
│   │   ├── search/
│   │   │   ├── components/
│   │   │   │   ├── CommandPalette.tsx      # Modal de busca fuzzy e ações
│   │   │   │   └── CommandPalette.module.scss
│   │   ├── editor/
│   │   │   ├── components/
│   │   │   │   ├── EditorBubbleMenu.tsx    # Menu flutuante de formatação
│   │   │   │   └── EditorBubbleMenu.module.scss
```

---

## 2. Decisões Arquiteturais (ADRs)

### ADR-007 — Persistência de Tipos Customizados em YAML
**Decisão:** Utilizar um campo especial `config` no YAML para armazenar metadados de UI (tipos de campos, opções de select).
**Motivo:** Manter a compatibilidade com Markdown puro enquanto permitimos uma experiência de "Database" (Notion-like). O campo armazena um JSON stringificado para facilitar o parse rápido via Regex.

---

### ADR-008 — Upgrade para TipTap 3 e Floating UI
**Decisão:** Uso do TipTap 3 com a dependência `@floating-ui/dom` em substituição ao Tippy.js.
**Motivo:** Melhor posicionamento de menus flutuantes (Bubble Menu) e redução no tamanho do bundle final. Os componentes de menu agora devem ser importados de `@tiptap/react/menus`.

---

## 3. Padrões de Dados

### Metadados (YAML Frontmatter)
As notas seguem o padrão abaixo para suportar campos dinâmicos:

```yaml
---
type: character
icon: "🛡️"
config: '{"Atributo":{"type":"select","options":["Força","Agilidade"]}}'
fields:
  Atributo: "Força"
---
```

### Localização de Assets
Imagens são organizadas para evitar conflitos e manter a portabilidade:
`[Workspace]/assets/[Subpasta_da_Nota]/[timestamp]_[nome].png`

---

## 4. UI Global e UX
- **Command Palette:** Acionado via `Ctrl + P`, centraliza navegação e comandos.
- **Bubble Menu:** Contextual, aparece apenas em seleções de texto para formatação rápida.
- **Modais:** Padronizados via `shared/components/Modal`, evitando diálogos nativos do browser.

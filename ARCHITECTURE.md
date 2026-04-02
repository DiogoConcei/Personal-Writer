# ARCHITECTURE.md — Editor Híbrido

**Versão:** 1.2  
**Stack:** Tauri 2 · React 19 · TypeScript · TipTap 3 · Zustand · SCSS Modules · Rust

---

### 1. Estrutura de Pastas (Novas Features)

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
│   │   │   ├── extensions/
│   │   │   │   ├── FontSize.ts             # Extensão customizada para tamanho de fonte
│   │   │   │   └── WikiLink/
```

---

## Mapa de Features Estáveis — Não Toque Sem Motivo

| Feature | Arquivos Críticos | Status |
| :--- | :--- | :--- |
| **Ecossistema de Imagem** | `ImageGallery.tsx`, `resolveAssetPath.ts` | ✅ Estável (Fase 3 Concluída) |
| **Persistência de YAML** | `editorStore.ts`, `metadataParser.ts` | ✅ Estável |
| **Drag-and-Drop** | `FileTree.tsx`, `FileTreeItem.tsx` | ✅ Estável — ADR-009 |

---

## 2. Decisões Arquiteturais (ADRs)


### ADR-009 — Drag-and-Drop via Mouse Events
**Decisão:** Abandono da HTML5 Drag and Drop API em favor de uma implementação manual usando MouseDown, MouseMove e MouseUp.
**Motivo:** A WebView2 (Windows) apresenta bugs inconsistentes de bloqueio de eventos `dragover` em elementos com `user-select: none`. A implementação manual garante 100% de confiabilidade e permite feedback visual (ghost element) mais fluido em ambientes Desktop.

### ADR-010 — Persistência de Lock de Snapshots
**Decisão:** Utilizar sufixos de arquivo para armazenar o estado de "trancado" de uma versão do histórico.
**Motivo:** Simplicidade local-first. Ao trancar uma versão `123.txt`, ela é renomeada para `123.locked.txt`. Isso evita a necessidade de um banco de dados de metadados extra, mantendo a portabilidade do histórico apenas via sistema de arquivos.

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

---

## 4. UI Global e UX
- **Atualizações Otimistas:** Operações de sistema de arquivos (mover, renomear) atualizam o estado do Zustand imediatamente, disparando a atualização do disco em background para uma sensação de performance instantânea.
- **::selection Customizado:** A cor de seleção de texto é padronizada para a cor de acento (Amethyst) para reforçar a identidade visual.

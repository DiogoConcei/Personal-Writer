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
| **Dicionário e Sinônimos**| `dictionary.rs`, `Spelling.ts` | ✅ Estável — ADR-011/012 (Refatorado v2) |
| **Sistema de Toasts**    | `uiStore.ts`, `ToastContainer.tsx` | ✅ Estável |
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

### ADR-011 — Motor de Ortografia 100% Rust (Spellbook)
**Decisão:** Substituição da crate `hunspell` (binding C++) pela crate `spellbook` (100% Rust).
**Motivo:** Garantir a portabilidade do projeto e facilidade de compilação em ambientes Windows (MSVC) sem a necessidade de instalar bibliotecas externas `.lib` ou configurar caminhos de linker complexos.

### ADR-012 — Mapeamento de Offsets Unicode via Node-Based Iteration
**Decisão:** O corretor ortográfico itera individualmente sobre cada nó de texto (`text node`) do ProseMirror, em vez do documento inteiro.
**Motivo:** O Rust processa strings em UTF-8 (offsets de bytes), enquanto o ProseMirror usa UTF-16 (offsets de caracteres). Ao tratar cada nó isoladamente, garantimos que o cálculo de `byteToCharIndex` seja 100% preciso, evitando que decorações fora dos limites causem travamentos (KI-027).

### ADR-013 — Dicionário Pessoal Global via AppData
**Decisão:** Armazenar palavras ignoradas pelo usuário em uma pasta global do sistema (`%AppData%`).
**Motivo:** Proporcionar consistência onde nomes de personagens criados pelo usuário sejam reconhecidos em todos os workspaces na mesma máquina.

### ADR-014 — Notificações Toasts Manuais
**Decisão:** Implementar Toasts para feedback de ações críticas (como Ctrl+S) sem poluir a interface com salvamentos automáticos.
**Motivo:** Manter a sensação de controle do usuário ("Eu salvei e o sistema confirmou") sem o ruído visual do auto-save de 10 em 10 minutos.

### ADR-015 — Arquitetura de Entidades Universais para Canvas
**Decisão:** Utilizar uma interface genérica `CanvasEntity<T>` para todos os elementos do Canvas (Notas, Imagens, PDFs).
**Motivo:** Extensibilidade total. As transformações (X, Y, Rotação, Resize) são universais, enquanto o payload de dados é isolado por tipo. Isso permite virtualização agressiva e simplifica o sistema de grupos e conexões futuras.

### ADR-016 — Configurações e Plugins Desacoplados
**Decisão:** Armazenar configurações de visualização (ex: zoom, grid) e estado de plugins em stores dedicadas (`uiStore`, `pluginStore`) separadas do conteúdo das notas.
**Motivo:** Persistência de preferências de interface sem modificar os arquivos `.md` originais, mantendo a integridade do sistema de arquivos do usuário.

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

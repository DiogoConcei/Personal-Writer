# KNOWN_ISSUES.md — Erros Conhecidos e Padrões Práticos

Este documento registra erros que já aconteceram durante o desenvolvimento, suas causas e as soluções corretas. Consulte aqui **antes** de implementar qualquer coisa relacionada a Rust, caminhos de arquivo ou configuração do Tauri.

---

## KI-014 — Bloqueio de DND Nativo na WebView2

**Sintoma:** O ícone do mouse vira um sinal de "proibido" (block) ao tentar arrastar itens, e os eventos de `dragover` não disparam.

**Causa:** No Windows, o componente WebView2 do Tauri possui um bug onde elementos com a propriedade CSS `user-select: none` bloqueiam a propagação da API nativa de Drag and Drop.

**Solução:** Implementar Drag-and-Drop customizado usando eventos de Mouse (`onMouseDown`, `onMouseMove`, `onMouseUp`) e `document.elementFromPoint` para detectar destinos.

---

## KI-015 — Erros de Importação de Extensões TipTap

**Sintoma:** `Uncaught SyntaxError: ... does not provide an export named 'default'`.

**Causa:** Algumas extensões oficiais do TipTap (como TextStyle e FontFamily) não possuem exports padrão, exigindo imports nomeados.

**Solução:** Utilizar sempre imports nomeados para extensões: `import { TextStyle } from '@tiptap/extension-text-style'`.

---

## KI-016 — Bubbling de Eventos em Pastas Hierárquicas

**Sintoma:** Ao arrastar um item sobre uma subpasta, o destaque visual pisca ou o evento de drop cai na pasta pai.

**Causa:** Propagação de eventos (`bubbling`) onde o pai também tenta processar o dragover.

**Solução:** Usar `e.stopPropagation()` rigorosamente nos handlers de pastas e garantir que itens que não aceitam drop (arquivos) permitam o bubble para que o contêiner raiz possa processar a movimentação.

---

## KI-017 — Variáveis Sass vs CSS em Novos Componentes

**Sintoma:** Erro `Undefined variable` (ex: `$obsidian`) ao compilar SCSS de novos componentes.

**Causa:** O projeto utiliza variáveis CSS nativas (`var(--color-...)`) definidas em `:root`. Variáveis Sass com `$` são legadas ou restritas a mixins específicos.

**Solução:** Sempre priorizar variáveis CSS nativas. Consulte `_variables.scss` para os nomes corretos.

---

## KI-018 — Perda de Escala Visual em Refatorações

**Sintoma:** O layout parece "pequeno" ou "quebrado" após mover o código para um novo componente.

**Causa:** Redução inadvertida de dimensões fixas (ex: 220x280 para 140x140) ou tamanhos de fonte durante a criação de novos arquivos `.module.scss`.

**Solução:** Ao extrair componentes (como o `CharacterHeader`), os estilos devem ser copiados com precisão absoluta do arquivo original. Verifique sempre as proporções "Hero" (Portrait grande, tipografia imponente) antes de finalizar.

---

## Padrões Gerais — Salvamento de Imagens

| Contexto              | Regra de Ouro                                                                        |
| :-------------------- | :----------------------------------------------------------------------------------- |
| **Colar/Soltar**      | Sempre converter para Bytes e salvar via comando Rust `save_image_from_bytes`.       |
| **Organização**       | Usar subpastas baseadas no local da nota para manter o workspace limpo.              |
| **Caminho Interno**   | Salvar no Markdown como `./assets/...` para garantir portabilidade entre workspaces. |
| **Preview Histórico** | Temporariamente desabilitado por bugs de escala. **REVISAR OBRIGATORIAMENTE**.       |

## Mapa de Features Estáveis — Não Toque Sem Motivo

| Feature                      | Arquivos Críticos                           | Status               |
| :--------------------------- | :------------------------------------------ | :------------------- |
| Drag-and-Drop (mouse events) | `FileTree.tsx`, `FileTreeItem.tsx`          | ✅ Estável — ADR-009 |
| Parsing de Frontmatter YAML  | `editorStore.ts` → `parseMarkdownMetadata`  | ✅ Estável           |
| Templates (character)        | `defaultTemplates.ts`, `MetadataHeader.tsx` | ✅ Estável           |
| WikiLinks                    | `features/editor/extensions/WikiLink/`      | ✅ Estável           |
| Imagens Inline               | `features/editor/extensions/Image/`         | ✅ Estável           |
| Auto-save com debounce       | `editorStore.ts`                            | ✅ Estável           |

Modificar qualquer arquivo desta tabela requer justificativa explícita e aprovação antes de qualquer código.

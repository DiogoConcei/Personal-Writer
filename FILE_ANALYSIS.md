# Análise de Arquivos (Maior Contagem de Linhas)

Esta tabela lista os 15 arquivos (.tsx, .ts, .rs) com a maior quantidade de linhas de código no repositório, conforme solicitado. Arquivos que excedem 300 linhas são destacados de acordo com a **ADR-018**.

| Caminho do Arquivo | Contagem de Linhas | Observação (ADR-018) |
| :--- | :---: | :--- |
| `src/features/editor/components/Core/Editor/Editor.tsx` | 640 | ⚠️ Excede 300 linhas |
| `src/features/canvas/components/InfiniteCanvas.tsx` | 463 | ⚠️ Excede 300 linhas |
| `src/features/SlashMenu/components/ImageGallery/ImageGallery.tsx` | 441 | ⚠️ Excede 300 linhas |
| `src-tauri/src/commands/dictionary.rs` | 438 | ⚠️ Excede 300 linhas |
| `src/features/workspace/components/FileTreeItem/FileTreeItem.tsx` | 346 | ⚠️ Excede 300 linhas |
| `src-tauri/src/commands/fs.rs` | 346 | ⚠️ Excede 300 linhas |
| `src/features/workspace/store/workspaceStore.ts` | 336 | ⚠️ Excede 300 linhas |
| `src/shared/hooks/useImageManager/useImageManager.ts` | 325 | ⚠️ Excede 300 linhas |
| `src/features/editor/components/History/VersionHistory/VersionHistory.tsx` | 312 | ⚠️ Excede 300 linhas |
| `src/features/editor/components/Headers/LocationHeader/LocationHeader.tsx` | 298 | Dentro do limite |
| `src/features/image-manager/components/AssetGallery/AssetGallery.tsx` | 235 | Dentro do limite |
| `src/features/editor/extensions/WikiLink/WikiLink.ts` | 218 | Dentro do limite |
| `src/features/canvas/components/CanvasSidebar/CanvasSidebar.tsx` | 196 | Dentro do limite |
| `src/features/universe/store/universeStore.ts` | 193 | Dentro do limite |
| `src/features/editor/extensions/Spelling.ts` | 187 | Dentro do limite |

---
*Nota: Configurações, arquivos .scss, .css e pastas de dependências (node_modules, target, dist) foram ignorados nesta análise.*

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

## KI-019 — Erro 500 / Falha de Importação no Vite (Dependência Circular)

**Sintoma:** O app não carrega e o console mostra erro 500 ou que um módulo não possui o export solicitado.

**Causa:** `editorStore.ts` importava `universeStore.ts` e vice-versa, criando um ciclo infinito de inicialização que o Vite/HMR não consegue resolver.

**Solução:** Extrair a lógica compartilhada (ex: `Metadata`, `parseMarkdownMetadata`) para um arquivo neutro e independente (`src/features/editor/store/metadataParser.ts`). As stores devem importar desse arquivo, quebrando o ciclo.

---

## KI-020 — Lentidão/Lag ao navegar entre notas

**Sintoma:** Ao clicar em uma nota na sidebar, há um atraso perceptível ("lag") e um flicker na tela antes do texto aparecer.

**Causa:** O editor TipTap estava sendo destruído e recriado do zero a cada troca porque o `activeFile` estava na lista de dependências do hook `useEditor`.

**Solução:** Remover `activeFile` das dependências do `useEditor`. Instanciar o editor apenas uma vez. Usar um `useEffect` separado para carregar o novo conteúdo usando `editor.commands.setContent(markdown, { emitUpdate: false })`, o que é instantâneo.

---

## KI-021 — Imagens do Cabeçalho Sumindo ao Recarregar

**Sintoma:** Ao definir um retrato de personagem ou imagem de localização, a imagem aparece na UI mas some após dar F5 ou trocar de nota.

**Causa:** O `setMetadata` atualizava o estado global (Zustand), mas não disparava o comando Rust de escrita no disco. Como o auto-save do editor era ativado apenas por digitação no texto, as mudanças nos metadados ficavam apenas em memória.

**Solução:** Refatorado `updateMetadata` nos cabeçalhos para chamar explicitamente `save(activeFile)` logo após a alteração do estado.

---

## KI-022 — Caminhos Absolutos Quebrando Portabilidade

**Sintoma:** Imagens param de carregar se a pasta do workspace for movida para outro diretório ou computador.

**Causa:** O uso de caminhos absolutos (ex: `C:\Users\...`) no Frontmatter.

**Solução:** Implementação da função centralizada `resolveAssetPath` no `tauri-bridge`. O sistema agora salva apenas caminhos relativos (`./assets/...`) e converte dinamicamente para o protocolo seguro do Tauri em tempo de execução. As barras invertidas do Windows (`\`) são normalizadas para `/` durante a persistência para compatibilidade máxima.

---

## KI-023 — Movimentação Acidental de Arquivos (Threshold Ausente)

**Sintoma:** Cliques simples em notas ou imagens disparavam o arraste (drag), movendo itens de subpastas para a raiz sem intenção. Abrir imagens também podia disparar o move.

**Causa:** Ausência de um limite mínimo (threshold) para distinguir um clique de um arrasto. Qualquer `mousedown` seguido de `mouseup` era tratado como uma operação de movimentação para o destino sob o mouse.

**Solução:** Implementado threshold duplo obrigatório: o arraste só é ativado se o mouse se deslocar mais de **5px** E o botão permanecer pressionado por mais de **150ms**. O `handleMouseUp` agora verifica essa flag antes de qualquer operação de `moveItem`. Além disso, a comparação de caminhos agora é agnóstica a barras (`/` vs `\`).

---

## KI-024 — Erro de Linker (LNK1181) com Crate Hunspell no Windows

**Sintoma:** Falha na compilação do Rust com o erro `fatal error LNK1181: não foi possível abrir o arquivo de entrada 'hunspell.lib'`.

**Causa:** A crate `hunspell` original é apenas um binding (ponte) para a biblioteca C++. No Windows, ela exige que a biblioteca compilada do Hunspell esteja presente no sistema e configurada no PATH do linker, o que quebra a portabilidade do projeto.

**Solução:** Substituir a crate por uma implementação **100% Rust**, como o `spellbook`. Isso elimina a dependência de bibliotecas C++ externas e garante que o projeto compile em qualquer máquina apenas com o Toolchain do Rust.

---

## KI-025 — Limitações de API em Crates de Ortografia (ZSpell vs Spellbook)

**Sintoma:** Erros de compilação como `no method named suggest` ou `cannot infer type`.

**Causa:** A crate `zspell` (versão 0.5.x) possui a API de sugestões marcada como "WIP" (em progresso) e não a expõe de forma estável. Além disso, a inicialização de dicionários pessoais exige o uso de Builders complexos.

**Solução:** Utilizar a crate **`spellbook`** (mantida pela equipe do editor Helix). Ela possui uma API estável e completa para `check`, `suggest` e `add`, além de ser compatível com o formato de dicionários do LibreOffice/Firefox.

---

## KI-026 — Incompatibilidade de Comandos curl/&& no PowerShell (Tauri Dev)

**Sintoma:** Erros de sintaxe ao tentar baixar arquivos ou rodar comandos encadeados via `run_shell_command`.

**Causa:** O alias `curl` no Windows PowerShell aponta para `Invoke-WebRequest`, que não suporta os mesmos parâmetros do cURL do Linux (como `-L`). Além disso, versões antigas do PowerShell não aceitam `&&` para encadeamento.

**Solução:** Utilizar o comando nativo do PowerShell: `iwr -Uri <URL> -OutFile <PATH>`. Para encadeamento de comandos, utilize o ponto e vírgula `;`.

---

## KI-027 — Travamento Total (Freeze) por Desalinhamento de Índices Unicode

**Sintoma:** A aplicação trava completamente após uma verificação ortográfica, exigindo fechar o processo.

**Causa:** Conflito de codificação. O Rust retorna posições de erro em **offsets de bytes (UTF-8)**, mas o ProseMirror espera **offsets de caracteres (UTF-16)**. Se o texto contém acentos (ex: 'á'), os índices divergem. Ao tentar renderizar uma decoração em um índice inválido, o motor da WebView entra em loop ou pânico visual.

**Solução:** Implementada a função `byteToCharIndex` no frontend usando `TextEncoder`/`TextDecoder` para converter precisamente os offsets de bytes do Rust para a contagem de caracteres do JS antes de aplicar as decorações no TipTap.

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

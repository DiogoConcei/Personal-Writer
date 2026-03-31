# KNOWN_ISSUES.md — Erros Conhecidos e Padrões Práticos

Este documento registra erros que já aconteceram durante o desenvolvimento, suas causas e as soluções corretas. Consulte aqui **antes** de implementar qualquer coisa relacionada a Rust, caminhos de arquivo ou configuração do Tauri.

---

## KI-010 — Importação de Menus no TipTap 3

**Sintoma:** `Uncaught SyntaxError: The requested module ... does not provide an export named 'BubbleMenu'`.

**Causa:** No TipTap 3, o componente React `BubbleMenu` foi movido para um ponto de entrada específico para otimização.

**Solução:** 
1. Importar de `@tiptap/react/menus` em vez de `@tiptap/react`.
2. Instalar a dependência `@floating-ui/dom`.
3. Renomear a prop `tippyOptions` para `options` no componente.

---

## KI-011 — Quebra de Floats em Contêineres Flex

**Sintoma:** O texto pula para baixo da imagem em vez de envolver a lateral (wrap), mesmo com `float: left/right`.

**Causa:** O contêiner pai do editor estava usando `display: flex`. Elementos flutuantes (`float`) não funcionam corretamente dentro de contextos flexbox.

**Solução:** Alterar o contêiner do editor (`.container`) para `display: block`.

---

## KI-012 — Seleção Azul Esticada em Imagens Flutuantes

**Sintoma:** Ao selecionar texto ao lado de uma imagem, o fundo azul ocupa toda a altura da imagem, criando um bloco visual estranho.

**Causa:** A imagem com `display: inline-block` estica a `line-height` da linha atual do parágrafo para corresponder à sua altura.

**Solução:** Forçar `display: block` no wrapper da imagem quando ela estiver usando os layouts `wrap-left` ou `wrap-right`. Elementos em bloco com `float` não afetam a altura da linha do texto adjacente.

---

## KI-013 — Virtualização de Pastas no Windows (Case Sensitivity)

**Sintoma:** A pasta virtual "Imagens" não aparece em certas subpastas.

**Causa:** Comparações de caminho no Windows falham se houver divergência entre `\` e `/` ou entre maiúsculas e minúsculas no nome da pasta raiz.

**Solução:** 
1. Normalizar todos os caminhos para minúsculo (`.toLowerCase()`).
2. Substituir todas as barras invertidas por barras normais (`.replace(/\\/g, '/')`) antes da comparação de prefixo.
3. Remover barras finais (`/`) de ambos os caminhos para garantir um "match" exato da string.

---

## Padrões Gerais — Salvamento de Imagens

| Contexto | Regra de Ouro |
| :--- | :--- |
| **Colar/Soltar** | Sempre converter para Bytes e salvar via comando Rust `save_image_from_bytes`. |
| **Organização** | Usar subpastas baseadas no local da nota para manter o workspace limpo. |
| **Caminho Interno** | Salvar no Markdown como `./assets/...` para garantir portabilidade entre workspaces. |

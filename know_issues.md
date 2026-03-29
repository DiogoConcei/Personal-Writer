# KNOWN_ISSUES.md — Erros Conhecidos e Padrões Práticos

Este documento registra erros que já aconteceram durante o desenvolvimento, suas causas e as soluções corretas. Consulte aqui **antes** de implementar qualquer coisa relacionada a Rust, caminhos de arquivo ou configuração do Tauri.

---

## KI-001 — `OUT_DIR env var is not set` ao compilar

**Sintoma:**

```
error: OUT_DIR env var is not set, do you have a build script?
  --> src\lib.rs:14:14
   |
14 |         .run(tauri::generate_context!())
```

**Causa:** O macro `tauri::generate_context!()` depende de variáveis de ambiente injetadas pelo sistema de build do Tauri. Rodar `cargo build` ou `cargo check` diretamente dentro de `src-tauri/` nunca funciona.

**Solução:** O único comando válido para compilar e testar é:

```bash
# Rodado SEMPRE na raiz do projeto, nunca dentro de src-tauri/
npm run tauri dev
```

**Regra derivada:** Nunca instrua `cargo build` ou `cargo check` diretamente. Sempre use `npm run tauri dev`.

---

## KI-002 — `build.rs` ausente no projeto Tauri

**Sintoma:** Mesmo erro do KI-001, ou erros de permissão/ambiente durante a compilação.

**Causa:** O Gemini CLI pode gerar o scaffold sem criar o `build.rs`, que é obrigatório em todo projeto Tauri.

**Solução:** Criar `src-tauri/build.rs` com o conteúdo padrão:

```rust
fn main() {
    tauri_build::build()
}
```

E confirmar que `tauri-build` está nas `[build-dependencies]` do `Cargo.toml`:

```toml
[build-dependencies]
tauri-build = { version = "2", features = [] }
```

---

## KI-003 — Ícone `.ico` ausente no Windows

**Sintoma:**

```
`icons/icon.ico` not found; required for generating a Windows Resource file during tauri-build
```

**Causa:** O scaffold foi entregue sem gerar os ícones. O Tauri exige ícones mesmo em desenvolvimento no Windows.

**Solução:**

1. Crie ou obtenha um PNG quadrado de pelo menos 1024×1024px
2. Salve como `src-tauri/icons/app-icon.png`
3. Rode na raiz do projeto:

```bash
npm run tauri icon src-tauri/icons/app-icon.png
```

Isso gera todos os tamanhos necessários automaticamente, incluindo `icon.ico`.

**Regra derivada:** O scaffold (Etapa 1) só está completo quando esse comando foi executado com sucesso.

---

## KI-004 — `ERR_CONNECTION_REFUSED` ao exibir imagens no Windows

**Sintoma:**

```
GET http://asset.localhost/C%3A%2FUsers%2F...%2Fassets%2Fpasted-xxx.png net::ERR_CONNECTION_REFUSED
```

**Causa:** O `convertFileSrc` do Tauri no Windows espera caminhos com barras invertidas nativas (`\`). Normalizar o caminho trocando `\` por `/` antes de passar para `convertFileSrc` quebra a resolução da URL.

**Padrão incorreto (não use):**

```typescript
// ERRADO — normalizar para / antes do convertFileSrc quebra no Windows
const normalizedPath = fullPath.replace(/\\/g, "/").replace(/\/+/g, "/");
src = convertFileSrc(normalizedPath);
```

**Padrão correto:**

```typescript
import { convertFileSrc } from "@tauri-apps/api/core";

// CORRETO — monta o caminho com separador nativo do Windows
const relativePart = src.replace("./", "");
const fullPath = `${rootPath}\\${relativePart.replace(/\//g, "\\")}`;

// Passa o caminho nativo diretamente para convertFileSrc
src = convertFileSrc(fullPath);
```

**Além disso**, o `assetProtocol` no `tauri.conf.json` precisa estar explicitamente habilitado:

```json
"security": {
  "assetProtocol": {
    "enable": true,
    "scope": ["$HOME/**", "$DESKTOP/**", "$DOCUMENT/**", "$DOWNLOAD/**"]
  }
}
```

---

## KI-005 — Atributos Rust inexistentes gerados pelo modelo

**Sintoma:**

```
error: cannot find attribute `cfg_bridge` in this scope
 --> src\lib.rs:6:3
  |
6 | #[cfg_bridge]
```

**Causa:** O Gemini inventou o atributo `#[cfg_bridge]`, que não existe no Rust nem no Tauri.

**Solução:** Deletar a linha inteira. Não há substituto — esse atributo não existe.

**Regra derivada:** Qualquer atributo Rust que você não reconheça (`#[algo]`) deve ser questionado antes de aceitar o código.

---

## KI-006 — Plugin Tauri referenciado sem estar no `Cargo.toml`

**Sintoma:**

```
error[E0433]: failed to resolve: use of unresolved module or unlinked crate `tauri_plugin_shell`
```

**Causa:** O modelo adicionou `.plugin(tauri_plugin_shell::init())` no `lib.rs` sem adicionar a crate correspondente no `Cargo.toml`.

**Solução:** Ou adicionar a crate:

```toml
[dependencies]
tauri-plugin-shell = "2"
```

Ou remover a linha do `lib.rs` se o plugin não for necessário. Na V1 deste projeto, `tauri_plugin_shell` não está no escopo — remova.

---

## Padrões Gerais — Caminhos de Arquivo no Windows

Sempre que lidar com caminhos de arquivo no frontend, siga estas regras:

| Situação                                        | Padrão correto                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| Montar caminho para `convertFileSrc`            | Use `\\` como separador — caminho nativo Windows                   |
| Caminho salvo no `.md`                          | Use `./assets/nome.png` — relativo, com `/`                        |
| Caminho passado para comandos Rust via `invoke` | Deixe o Rust normalizar — passe o caminho como recebido do backend |
| Exibir caminho na UI (breadcrumb, etc.)         | Substitua `\\` por `/` para legibilidade                           |

---

---

## KI-008 — Limitações do Parser de YAML (Regex)

**Sintoma:** Campos complexos no YAML (como listas aninhadas ou objetos multilinhas) não aparecem corretamente no Cabeçalho Visual.

**Causa:** O sistema utiliza um parser baseado em expressões regulares (Regex) para maior performance e simplicidade na V1. Ele espera o formato `chave: valor` simples.

**Estado:** Comportamento aceitável para a V1 focado em campos de ficha técnica.

**Prevenção:** Evitar estruturas YAML profundamente aninhadas se desejar edição visual.

---

## KI-009 — Conflito de Injeção no TipTap

**Sintoma:** O cabeçalho visual some ao salvar ou recarregar rapidamente.

**Causa:** O TipTap às vezes tenta normalizar o conteúdo removendo o nó `metadataHeader` se ele não encontrar um parágrafo válido logo abaixo.

**Solução:** O carregamento agora força a criação de um parágrafo vazio (`{ type: 'paragraph' }`) logo após o cabeçalho no JSON do editor.

## Como Atualizar Este Documento

Sempre que um novo erro for resolvido durante o desenvolvimento:

1. Documente o sintoma exato (mensagem de erro completa)
2. Explique a causa raiz
3. Registre a solução que funcionou
4. Se gerar uma regra geral, adicione à tabela de padrões ou ao `GEMINI.md`

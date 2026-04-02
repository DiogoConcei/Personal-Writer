# PRD — O Arquiteto (V1.7: Indexação e Inteligência)

**Versão:** 1.7  
**Foco:** Infraestrutura de Dados e Relacionamentos Narrativos  
**Status:** Planejado (Fase 1 do Roadmap de Universo)

---

## 1. Visão Geral
Transformar o conjunto de arquivos `.md` em um **Grafo de Conhecimento** em memória. O objetivo é permitir que o editor entenda as conexões entre personagens, locais e eventos sem depender de buscas lentas no disco.

---

## 2. Features Principais

### Feature 1 — Universe Indexer (O Cérebro)
**Objetivo:** Centralizar os metadados de todo o workspace em uma store Zustand reativa.
- **Boot Indexing:** Ao carregar o workspace, o sistema realiza um parse rápido (apenas frontmatter e links `[[ ]]`) de todos os arquivos.
- **Worker-based:** O processamento deve ser otimizado para não travar a UI (Main Thread).
- **Entidades:** Classificação automática em `Character`, `Location`, `Event`, `Item` ou `Note`.

### Feature 2 — Backlinks Automáticos (Relacionamentos)
**Objetivo:** Gerar visualização de "Onde este elemento foi mencionado" sem esforço manual.
- **Mecânica:** Se a nota "Taberna" contém `[[Protagonista]]`, o perfil do "Protagonista" mostra automaticamente um link de volta para a "Taberna".
- **Contexto:** (Opcional) Mostrar a frase ou o parágrafo onde a menção ocorreu.

### Feature 3 — Atributos Comparativos (Tabela de Universo)
**Objetivo:** Visão analítica de atributos para garantir consistência (ex: idades, níveis de poder, facções).
- **Interface:** Uma aba "Tabela" no Dashboard que lista entidades em linhas e campos do frontmatter em colunas.
- **Edição em Lote:** (Opcional) Permitir alterar um atributo diretamente na tabela.

---

## 3. Requisitos Técnicos e Arquitetura

1.  **`universeStore.ts`:** Store Zustand que armazena o dicionário de entidades e o mapa de conexões.
2.  **Deduplicação de Links:** O indexador deve tratar nomes de arquivos e caminhos relativos de forma única para evitar links quebrados.
3.  **Performance:** Alvo de < 500ms para indexar 100 notas em uma máquina média.

---

## 4. Critérios de Aceitação
- [ ] O índice deve atualizar automaticamente ao salvar qualquer arquivo no editor.
- [ ] A seção "Mencionado em" deve aparecer no `CharacterHeader` e no `LocationHeader`.
- [ ] O Dashboard deve carregar instantaneamente usando os dados da store, sem ler o disco novamente.

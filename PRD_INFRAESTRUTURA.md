# PRD — Infraestrutura e Performance

**Foco:** Core do sistema, persistência e otimização de busca.

---

## Features Principais

### Feature 1 — Motor de Indexação SQLite
**Objetivo:** Cache de alta performance para busca e dashboard.
- **Arquitetura:** SQLite como cache de índices; arquivos `.md` permanecem como fonte da verdade.
- **Indexação:** Extração automática de YAML, backlinks e contagem de palavras para o banco de dados.

### Feature 2 — Asset Manager (Rust)
**Objetivo:** Monitoramento eficiente da pasta `/assets` e controle de metadados de versionamento.

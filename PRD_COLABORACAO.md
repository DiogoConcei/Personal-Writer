# PRD — Colaboração

**Foco:** Conexão entre usuários e trabalho conjunto local-first.

---

## Features Principais

### Feature 1 — Colaboração em Tempo Real (P2P)
**Objetivo:** Edição simultânea de arquivos `.md` sem servidor central.
- **Mecânica:** Utilização de CRDTs (Yjs ou Automerge) para convergência de dados.
- **Transporte:** Backend Rust gerencia conexões via WebRTC ou redes locais.

### Feature 2 — Indicadores de Presença
**Objetivo:** Feedback visual de colaboradores ativos.
- **UI:** Cursores coloridos com nome do usuário e destaque de seleção remota.

### Feature 3 — Workspaces Compartilhados
**Objetivo:** Sincronizar pastas inteiras entre dispositivos de forma segura.
- **Segurança:** Criptografia ponta-a-ponta (E2EE) em todos os dados trafegados.

### Feature 4 — Resolução Visual de Conflitos
**Objetivo:** Interface para resolver divergências de edições offline.
- **UI:** Comparação lado-a-lado para escolha de versões ou mesclagem manual.

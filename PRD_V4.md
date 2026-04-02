# PRD — A Rede (V4: Colaboração e Conexão)

**Versão:** 4.0  
**Foco:** Colaboração Local-first e Compartilhamento P2P  
**Stack Base:** CRDTs (Yjs ou Automerge) · libp2p (Rust) · WebRTC

---

## 1. Visão Geral
Habilitar a colaboração entre usuários de forma segura e descentralizada. O foco não é o "cloud", mas sim a conexão direta entre dois ou mais editores para trabalho conjunto em projetos e estudos.

---

## 2. Features Planejadas

### Feature 1 — Colaboração em Tempo Real (P2P)
**Objetivo:** Permitir que dois usuários editem o mesmo arquivo `.md` simultaneamente.
- **Mecânica:** Utilização de **CRDTs** para garantir que as edições converjam sem conflitos.
- **Transporte:** O backend Rust gerencia conexões P2P via WebRTC ou redes locais, evitando a necessidade de um servidor intermediário persistente.

### Feature 2 — Indicadores de Presença (Cursos Remotos)
**Objetivo:** Visualizar onde outros colaboradores estão editando no texto.
- **UI:** Cursores coloridos com o nome do usuário e destaque de seleção em tempo real.
- **Sincronização:** Broadcast de metadados de UI via canal de dados seguro.

### Feature 3 — Workspaces Compartilhados
**Objetivo:** Sincronizar pastas inteiras entre dispositivos.
- **Funcionalidade:** Um usuário pode "Convidar" outro para uma pasta. O sistema espelha a árvore de arquivos e gerencia o versionamento das alterações.
- **Segurança:** Criptografia ponta-a-ponta (E2EE) em todos os dados trafegados.

### Feature 4 — Resolução Visual de Conflitos
**Objetivo:** Ferramenta para lidar com edições que ocorreram enquanto um dos usuários estava offline.
- **UI:** Interface de "Merge" simplificada, permitindo escolher entre versões ou mesclar trechos específicos de Markdown.

---

## 3. Requisitos Técnicos e Arquitetura

1.  **CRDT Engine:** Integração do `y-rust` ou `automerge-rs` no core do Tauri para gerenciar o estado do documento de forma performática.
2.  **Protocolo P2P:** Implementação de descoberta de rede local (mDNS) para que usuários na mesma rede se encontrem automaticamente.
3.  **State Snapshotting:** O sistema deve salvar snapshots binários do CRDT para permitir a reconstrução rápida do histórico de colaboração.

---

## 4. Critérios de Aceitação
- [ ] A latência de edição entre dois dispositivos na mesma rede deve ser inferior a 50ms.
- [ ] O sistema deve suportar até 5 colaboradores simultâneos no mesmo arquivo sem degradação de performance.
- [ ] Perda de conexão não deve resultar em perda de dados (salvamento local garantido).

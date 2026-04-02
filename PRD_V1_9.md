# PRD — O Cronista (V1.9: Contexto e Conexões)

**Versão:** 1.9  
**Foco:** Relacionamentos Bidirecionais e Navegação Inteligente  
**Status:** Planejado (Fase 3 do Roadmap de Universo)

---

## 1. Visão Geral
Conectar os pontos do universo. Transformar menções isoladas em uma teia de relacionamentos que permite ao escritor rastrear a presença de qualquer entidade ao longo de todo o manuscrito.

---

## 2. Features Principais

### Feature 1 — Backlinks Narrativos (Mencionado em...)
**Objetivo:** Mostrar onde um personagem ou local aparece sem edição manual.
- **Mecânica:** Se a nota "Cena 01" cita `[[Protagonista]]`, o perfil do "Protagonista" lista automaticamente a "Cena 01" como uma aparição.
- **UI:** Nova seção "Visto em..." nos headers de personagem e localização.

### Feature 2 — Quick Look (Preview de Entidade)
**Objetivo:** Consultar detalhes sem perder o contexto da escrita.
- **Interação:** `Ctrl + Hover` sobre um link `[[ ]]` abre um popover elegante com o resumo e a imagem da entidade.

### Feature 3 — WikiLinks com Ícones
**Objetivo:** Diferenciação visual imediata no texto.
- **Mecânica:** O autocomplete e os links no editor exibem ícones discretos baseados no `type` (User para personagem, Map para local).

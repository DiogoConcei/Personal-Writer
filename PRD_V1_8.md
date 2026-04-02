# PRD — O Elenco (V1.8: Imersão e Visual Heroico)

**Versão:** 1.8  
**Foco:** Estética "AAA", Imersão Visual e Galeria de Personagens  
**Status:** Planejado (Fase 2 do Roadmap de Universo)

---

## 1. Visão Geral
Entregar a experiência visual definitiva para o escritor. Inspirado em interfaces de seleção de personagens de jogos modernos (LoL, Overwatch), transformando a gestão de personagens em uma galeria imersiva e inspiradora.

---

## 2. Features Principais

### Feature 1 — Galeria Heroica (Character Gallery)
**Objetivo:** Substituir a lista genérica por um grid imersivo de artes de personagem.
- **Visual:** Grid responsivo de cards verticais (proporção de pôster 2:3).
- **Artes de Capa:** Uso do campo `icon` do frontmatter como imagem de fundo total (*cover*) do card.
- **Tipografia:** Nome do personagem em destaque na base do card com gradiente de legibilidade (Overlay).
- **Animações:** Transições suaves de hover (zoom sutil) e entrada de cards.

### Feature 2 — Filtros Dinâmicos de Universo
**Objetivo:** Navegar em universos com centenas de elementos através de atributos.
- **Mecânica:** O sistema lê todas as chaves únicas no campo `fields` dos metadados e gera filtros de dropdown automáticos (ex: filtro por "Casta", "Status", "Alinhamento").
- **Smart Search:** Busca que filtra os cards em tempo real por nome ou qualquer atributo visível.

---

## 3. Requisitos Técnicos
1. Consome dados exclusivamente da `universeStore` (V1.7).
2. Implementação de CSS Grid com `aspect-ratio: 2/3`.
3. Uso de `convertFileSrc` para carregar artes locais.

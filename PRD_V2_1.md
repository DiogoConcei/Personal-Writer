# PRD — O Revisor (V2.1: Qualidade e Ortografia)

**Versão:** 2.1  
**Foco:** Garantia de Escrita Correta e Revisão  

---

## 1. Visão Geral
Implementar a funcionalidade de maior risco técnico: o corretor ortográfico nativo, garantindo que o texto final esteja livre de erros gramaticais básicos em Português (PT-BR).

---

## 2. Features Principais

### Feature 1 — Corretor Ortográfico Nativo (PT-BR) ✅
- **Engine:** Integração com Spellbook (100% Rust) via Rust.
- **UX:** Sublinhado ondulado vermelho em palavras desconhecidas com mapeamento preciso de Unicode.

### Feature 2 — Menu de Sugestões ✅
- **Mecânica:** Clique com botão direito oferece sugestões de correção e a opção "Adicionar ao Dicionário".

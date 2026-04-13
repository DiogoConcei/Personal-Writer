# PRD — Estudo de Línguas e Filologia

**Foco:** Ferramentas de imersão linguística, análise de complexidade textual e auxílio fonético (Foco inicial: Inglês).

---

## Features Principais

### Feature 1 — Reading Level Indicator (CEFR / Flesch-Kincaid)
**Objetivo:** Calibrar a complexidade do texto escrito ou lido (A1 até C2).
- **Mecânica:** Analisador matemático que calcula o nível de proficiência estimado do texto selecionado ou da nota inteira.
- **Métricas:** Baseado em algoritmos como *Flesch-Kincaid Grade Level* ou *Gunning Fog Index* adaptados para o quadro europeu (CEFR).
- **UI:** Badge discreta no StatusBar ou cabeçalho da nota indicando o nível (ex: "Nível: B2 - Intermediário Superior").
- **Implementação:** 100% Offline via Rust (análise de sílabas, contagem de palavras complexas e extensão de sentenças).

### Feature 2 — Word Insights (IPA & Fonética)
**Objetivo:** Compreensão profunda da pronúncia.
- **Funcionalidade:** Exibição da transcrição fonética (IPA - International Phonetic Alphabet) ao selecionar uma palavra.
- **Exemplo:** Selecionar "Schedule" -> Exibe `/ˈʃɛd.juːl/` ou `/ˈskɛdʒ.uːl/`.
- **Dicionário:** Integração com base de dados fonética leve para consulta offline.

### Feature 3 — Pronúncia Ativa (TTS - Text-to-Speech)
**Objetivo:** Praticar a escuta e a fonética.
- **Mecânica:** Botão de "Play" para ouvir a pronúncia da palavra ou parágrafo selecionado.
- **Tecnologia:** Uso do motor de voz (TTS) nativo do sistema operacional através de comandos do Tauri.

### Feature 4 — Tradução Inline (Bridge Translation)
**Objetivo:** Auxiliar na compreensão de sentenças complexas sem quebrar o fluxo.
- **Funcionalidade:** Tradução rápida de trechos selecionados.
- **UI:** Tooltip flutuante ou painel lateral de referências que exibe a tradução mantendo o texto original visível.

---

## Requisitos Técnicos

1.  **Lógica de Sílabas (Rust):** Implementar um contador de sílabas robusto no backend para o cálculo do Reading Level.
2.  **Tauri TTS Bridge:** Criar um comando Tauri que faça a ponte com as APIs de acessibilidade do Windows/macOS/Linux para reprodução de áudio.
3.  **Local Context:** O nível de leitura deve ser recalculado com debounce durante a escrita para não afetar a performance.

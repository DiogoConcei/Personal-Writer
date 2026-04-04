# Editor Híbrido 💜

Um editor de notas Desktop moderno, local-first e extensível, construído com **Tauri 2** e **React 19**.

## ✨ Recursos Principais

- 🖋️ **Editor Rich-Text**: Experiência TipTap polida com suporte a Markdown.
- 📖 **Dicionário e Sinônimos**: Corretor ortográfico nativo (PT-BR) e dicionário de sinônimos offline integrados via Rust.
- 📂 **Organização Fluida**: Árvore de arquivos com Drag-and-Drop ultra-rápido e atualizações otimistas.
- 🖼️ **Gestão de Imagens**: Galeria integrada com upload local e suporte a layouts flexíveis (float/wrap).
- 🔗 **WikiLinks**: Navegação rápida estilo Obsidian com autocomplete.
- 🕒 **Histórico de Versões**: snapshots automáticos com funcionalidade de congelar (marcos).
- 📊 **Dashboard Visual**: Visualize suas notas como cards organizados.
- 🎨 **UI Premium**: Paleta Amethyst + Gunmetal com design simétrico e focado em escrita.

## 🚀 Tecnologias

- **Frontend**: React 19, TypeScript, Vite
- **Estado**: Zustand
- **Estilo**: SCSS Modules
- **Desktop**: Tauri 2 (Rust)
- **Editor**: TipTap 3

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run tauri dev
```

## 📜 Documentação Interna

- [PRD_V1.md](./PRD_V1.md) — Visão do produto e status das features.
- [ARCHITECTURE.md](./ARCHITECTURE.md) — Decisões de design e padrões de código.
- [KNOWN_ISSUES.md](./know_issues.md) — Soluções para problemas técnicos recorrentes.

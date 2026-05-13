# Editor Híbrido 💜

Um editor de notas Desktop moderno, local-first e extensível, construído com **Tauri 2** e **React 19**.

## ✨ Recursos Principais

- 🖋️ **Editor Rich-Text**: Experiência TipTap 3 polida com suporte a Markdown, KaTeX (fórmulas) e Checklist.
- ♾️ **Infinite Canvas**: Quadro branco espacial infinito para organizar notas, imagens e PDFs com rotação Z, panning fluido e **redimensionamento em 4 cantos**.
- ⚙️ **Configurações Centralizadas**: Painel completo para personalização do editor, plugins e preferências globais.
- 📖 **Dicionário e Sinônimos**: Corretor ortográfico nativo (PT-BR) e dicionário de sinônimos offline integrados via Rust.
- 📁 **Organização Fluida**: Árvore de arquivos com Drag-and-Drop ultra-rápido e atualizações otimistas. 
- 🖼️ **Gestão de Imagens**: Galeria integrada com upload local, suporte a layouts flexíveis e persistência de crop.
- 🔗 **WikiLinks**: Navegação rápida estilo Obsidian com autocomplete via Slash Menu (`/`).
- 📜 **Histórico de Versões**: Snapshots automáticos com funcionalidade de congelar (marcos/milestones).
- 📊 **Dashboard Visual**: Visualize suas notas como cards organizados e acompanhe o progresso através de uma Timeline.
- 🎨 **UI Premium**: Paleta Amethyst + Gunmetal com design simétrico, focado em escrita e performance.

## 🚀 Tecnologias

- **Frontend**: React 19 (Compiler enabled), TypeScript, Vite
- **Estado**: Zustand 5
- **Estilo**: SCSS Modules
- **Desktop**: Tauri 2 (Rust)
- **Editor**: TipTap 3
- **PDF**: React-PDF

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar em modo desenvolvimento
npm run tauri dev

# Build e Verificação
npm run build
```

## 🚩 Status Atual e Próximos Passos

- [x] **Slash Menu & Templates**: Sistema estabilizado e funcional.
- [x] **Infinite Canvas**: Suporte a transformações 2D e múltiplos tipos de entidades.
- [ ] **Refinamento de Canvas**: Otimizar translação de grupos de desenhos (strokes).
- [ ] **Módulo Universe**: Implementar deleção profunda (cascade delete) para personagens e assets vinculados.
- [ ] **Performance**: Otimizar indexação de busca e gerenciar arquivos de log/resultados (CSV).
- [ ] **React 19 Hooks**: Migrar chamadas assíncronas do Tauri para `useActionState` e `useTransition`.

## 📜 Documentação Interna

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Decisões de design e padrões de código.
- [KNOWN_ISSUES.md](./know_issues.md) — Soluções para problemas técnicos recorrentes e limitações conhecidas.

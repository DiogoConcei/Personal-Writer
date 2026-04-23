import Mathematics from '@tiptap/extension-mathematics';

/**
 * Extensão Modular de Matemática para o Editor.
 * Esta função injeta dinamicamente o CSS do KaTeX apenas quando a funcionalidade é ativada,
 * seguindo a arquitetura de plugins híbrida para manter a performance.
 */
export const getMathExtension = () => {
  if (typeof document !== 'undefined') {
    const existingLink = document.getElementById('katex-css');
    if (!existingLink) {
      const link = document.createElement('link');
      link.id = 'katex-css';
      link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      console.log('[PluginManager] CSS do KaTeX injetado dinamicamente para suporte a LaTeX.');
    }
  }

  return Mathematics;
};

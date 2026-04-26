import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { convertFileSrc } from '@tauri-apps/api/core';
import { Entity } from '@/shared/types';

/**
 * Hook centralizado para resolver o ícone visual de uma entidade (Personagem, Localização ou Nota).
 * Trata emojis, caminhos relativos de imagem e ícones padrão.
 */
export function useEntityIcon() {
  const { rootPath } = useWorkspaceStore();

  const getImageUrl = (icon?: string) => {
    if (!icon) return null;

    // Detecta se é um caminho de arquivo (contém barras ou extensões)
    if (icon.includes('/') || icon.includes('\\') || icon.includes('.')) {
      if (icon.startsWith('./') && rootPath) {
        const relativePart = icon.replace('./', '');
        const separator = rootPath.includes('\\') ? '\\' : '/';
        const fullPath = `${rootPath}${separator}${relativePart.replace(/[\\/]/g, separator)}`;
        return convertFileSrc(fullPath);
      }
      
      // Se for um caminho absoluto ou URL já resolvida
      if (icon.startsWith('http') || /^[a-zA-Z]:[\\/]/.test(icon) || icon.startsWith('/')) {
        return convertFileSrc(icon);
      }
    }
    
    // Se não for caminho, assume-se que é um Emoji ou string simples
    return null;
  };

  const resolveEntityIcon = (entity: Entity) => {
    const imageUrl = getImageUrl(entity.icon);
    const isEmoji = entity.icon && !imageUrl;
    
    return {
      imageUrl,
      isEmoji,
      icon: entity.icon,
      type: entity.type
    };
  };

  return { resolveEntityIcon, getImageUrl };
}

import { useState, useCallback } from 'react';
import { UseCanvasUIHandlersProps } from '@/shared/types';

/**
 * Hook orquestrador da interface do Canvas.
 * Gerencia estados de seleção, modos de visualização e ferramentas.
 */
export function useCanvasUIHandlers({
  entities,
  isCollageActive,
  isScissorsActive,
  activateSelect,
  activateScissors,
  bringToFront,
  setSideMenuMode
}: UseCanvasUIHandlersProps) {
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [isSplitModeActive, setIsSplitModeActive] = useState(false);
  const [isCollageConfirmed, setIsCollageConfirmed] = useState(false);
  const [activeCollageGroupId, setActiveCollageGroupId] = useState<string | null>(null);

  const handleSelectItem = useCallback((id: string | null) => {
    if (!id) {
      setSelectedItemId(null);
      setSelectedItemIds([]);
      return;
    }

    if (isCollageActive) {
      setSelectedItemIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id].slice(-10)
      );
      return id;
    }

    if (isScissorsActive) {
      // No modo tesoura, o clique foca o item mas não entra em modo de edição
      setSelectedItemId(id);
      return id;
    }

    setSelectedItemId(id);
    setSelectedItemIds([id]);
    bringToFront(id);

    // Ajusta o menu lateral dependendo do tipo selecionado
    const entity = entities.find(e => e.id === id);
    if (entity?.type === 'note') setSideMenuMode('notes');
    else if (entity?.type === 'postit') setSideMenuMode('postits');
    else if (entity?.type === 'text') setSideMenuMode('text');
    else setSideMenuMode('main');

    return id;
  }, [isCollageActive, isScissorsActive, entities, bringToFront, setSideMenuMode]);

  const handleToggleScissors = useCallback(() => {
    if (isScissorsActive) {
      activateSelect();
    } else {
      activateScissors();
      setSelectedItemId(null);
      setSelectedItemIds([]);
    }
  }, [isScissorsActive, activateSelect, activateScissors]);

  const handleToggleSplitMode = useCallback(() => {
    setIsSplitModeActive(prev => !prev);
  }, []);

  return {
    selectedItemId,
    setSelectedItemId,
    selectedItemIds,
    setSelectedItemIds,
    isSplitModeActive,
    setIsSplitModeActive,
    isCollageConfirmed,
    setIsCollageConfirmed,
    activeCollageGroupId,
    setActiveCollageGroupId,
    handleSelectItem,
    handleToggleScissors,
    handleToggleSplitMode
  };
}

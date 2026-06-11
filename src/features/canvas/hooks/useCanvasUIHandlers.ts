import { useState, useCallback } from 'react';
import { UseCanvasUIHandlersProps, CanvasUIState } from '@/shared/types';

/**
 * Hook orquestrador da interface do Canvas.
 * Gerencia estados de seleção, modos de visualização e ferramentas.
 */
export function useCanvasUIHandlers({
  entities,
  isCollageActive,
  isScissorsActive,
  isAttachActive,
  activateSelect,
  activateScissors,
  activateAttach,
  bringToFront,
  setSideMenuMode,
  ...externalState
}: UseCanvasUIHandlersProps & Partial<CanvasUIState>) {
  // Estados internos (usados apenas se não fornecidos externamente)
  const [internalSelectedItemId, setInternalSelectedItemId] = useState<string | null>(null);
  const [internalSelectedItemIds, setInternalSelectedItemIds] = useState<string[]>([]);
  const [internalIsSplitModeActive, setInternalIsSplitModeActive] = useState(false);
  const [internalIsCollageConfirmed, setInternalIsCollageConfirmed] = useState(false);
  const [internalActiveCollageGroupId, setInternalActiveCollageGroupId] = useState<string | null>(null);

  // Mapeamento para estado externo ou interno
  const selectedItemId = externalState.selectedItemId !== undefined ? externalState.selectedItemId : internalSelectedItemId;
  const setSelectedItemId = externalState.setSelectedItemId || setInternalSelectedItemId;
  
  const selectedItemIds = externalState.selectedItemIds !== undefined ? externalState.selectedItemIds : internalSelectedItemIds;
  const setSelectedItemIds = externalState.setSelectedItemIds || setInternalSelectedItemIds;

  const isSplitModeActive = externalState.isSplitModeActive !== undefined ? externalState.isSplitModeActive : internalIsSplitModeActive;
  const setIsSplitModeActive = externalState.setIsSplitModeActive || setInternalIsSplitModeActive;

  const isCollageConfirmed = externalState.isCollageConfirmed !== undefined ? externalState.isCollageConfirmed : internalIsCollageConfirmed;
  const setIsCollageConfirmed = externalState.setIsCollageConfirmed || setInternalIsCollageConfirmed;

  const activeCollageGroupId = externalState.activeCollageGroupId !== undefined ? externalState.activeCollageGroupId : internalActiveCollageGroupId;
  const setActiveCollageGroupId = externalState.setActiveCollageGroupId || setInternalActiveCollageGroupId;

  const handleSelectItem = useCallback((id: string | null) => {
    if (!id) {
      setSelectedItemId(null);
      setSelectedItemIds([]);
      return;
    }

    if (isCollageActive || isAttachActive) {
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
    else if (entity?.type === 'page') setSideMenuMode('pages');
    else setSideMenuMode('main');

    return id;
  }, [isCollageActive, isAttachActive, isScissorsActive, entities, bringToFront, setSideMenuMode, setSelectedItemId, setSelectedItemIds]);

  const handleToggleScissors = useCallback(() => {
    if (isScissorsActive) {
      activateSelect();
    } else {
      activateScissors();
      setSelectedItemId(null);
      setSelectedItemIds([]);
    }
  }, [isScissorsActive, activateSelect, activateScissors, setSelectedItemId, setSelectedItemIds]);

  const handleToggleAttach = useCallback(() => {
    if (isAttachActive) {
      activateSelect();
    } else {
      activateAttach();
      // Se houver um item selecionado que seja nota, mantemos ele como base da seleção?
      // Melhor limpar e deixar o usuário selecionar o que quer anexar a quê.
      setSelectedItemId(null);
      setSelectedItemIds([]);
    }
  }, [isAttachActive, activateSelect, activateAttach, setSelectedItemId, setSelectedItemIds]);

  const handleToggleSplitMode = useCallback(() => {
    setIsSplitModeActive((prev) => !prev);
  }, [setIsSplitModeActive]);

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
    handleToggleAttach,
    handleToggleSplitMode
  };
}

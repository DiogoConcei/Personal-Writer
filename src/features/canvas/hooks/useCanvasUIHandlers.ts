import { useState, useCallback, useEffect } from 'react';
import { AnyCanvasEntity, UseCanvasUIHandlersProps } from '@/shared/types';

export function useCanvasUIHandlers({
  entities,
  activeTool,
  isPencilActive,
  isTextActive,
  isCollageActive,
  isScissorsActive,
  activateSelect,
  activateScissors,
  bringToFront,
  setSideMenuMode
}: UseCanvasUIHandlersProps) {
  const [isSplitModeActive, setIsSplitModeActive] = useState(false);
  const [isCollageConfirmed, setIsCollageConfirmed] = useState(false);
  const [activeCollageGroupId, setActiveCollageGroupId] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);

  // Sincronizar painel lateral com ferramentas e seleção
  useEffect(() => {
    if (isPencilActive) {
      setSideMenuMode("drawing");
    } else if (isTextActive) {
      setSideMenuMode("text");
    } else if (isCollageActive) {
      setSideMenuMode("main");
    } else {
      const selectedEntity = entities.find((e) => e.id === selectedItemId);
      if (selectedEntity?.type === "note" || selectedEntity?.type === "page") {
        setSideMenuMode("notes");
      } else if (selectedEntity?.type === "postit") {
        setSideMenuMode("postits");
      } else {
        setSideMenuMode("main");
      }
    }
  }, [isPencilActive, isTextActive, isCollageActive, selectedItemId, entities, setSideMenuMode]);

  const handleToggleSplitMode = useCallback((active: boolean) => {
    setIsSplitModeActive(active);
    if (active) {
      setSelectedItemId(null);
      setSelectedItemIds([]);
      if (isScissorsActive) activateSelect();
    }
  }, [isScissorsActive, activateSelect]);

  const handleToggleScissors = useCallback(() => {
    if (isScissorsActive) {
      activateSelect();
    } else {
      activateScissors();
      setSelectedItemId(null);
      setSelectedItemIds([]);
      setIsSplitModeActive(false);
    }
  }, [isScissorsActive, activateSelect, activateScissors]);

  const handleSelectItem = useCallback((id: string) => {
    const entity = entities.find(e => e.id === id);
    if (isCollageActive && !isCollageConfirmed) {
      setSelectedItemIds(prev => {
        if (prev.includes(id)) {
          return prev.filter(itemId => itemId !== id);
        }
        if (prev.length >= 10) return prev;
        return [...prev, id];
      });
      setSelectedItemId(id);
    } else {
      setSelectedItemIds([id]);
      setSelectedItemId(id);
    }
    
    if (entity?.type !== 'page') {
      bringToFront(id);
    }
  }, [entities, isCollageActive, isCollageConfirmed, bringToFront]);

  return {
    isSplitModeActive,
    setIsSplitModeActive,
    isCollageConfirmed,
    setIsCollageConfirmed,
    activeCollageGroupId,
    setActiveCollageGroupId,
    selectedItemId,
    setSelectedItemId,
    selectedItemIds,
    setSelectedItemIds,
    handleToggleSplitMode,
    handleToggleScissors,
    handleSelectItem
  };
}

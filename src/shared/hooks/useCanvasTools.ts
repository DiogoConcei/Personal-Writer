import { useState, useCallback } from 'react';

export type CanvasTool = 
  | 'select' 
  | 'pan' 
  | 'pencil' 
  | 'eraser' 
  | 'scissors' 
  | 'text' 
  | 'connect' 
  | 'collage'
  | 'group'
  | 'attach';

/**
 * Hook compartilhado para gestão de estado de ferramentas em superfícies de Canvas.
 * Garante atomicidade: apenas uma ferramenta de interação pode estar ativa por vez.
 */
export function useCanvasTools(initialTool: CanvasTool = 'select') {
  const [activeTool, setActiveTool] = useState<CanvasTool>(initialTool);

  const isSelectActive = activeTool === 'select';
  const isPanActive = activeTool === 'pan';
  const isPencilActive = activeTool === 'pencil';
  const isEraserActive = activeTool === 'eraser';
  const isScissorsActive = activeTool === 'scissors';
  const isTextActive = activeTool === 'text';
  const isConnectActive = activeTool === 'connect';
  const isCollageActive = activeTool === 'collage';
  const isGroupActive = activeTool === 'group';
  const isAttachActive = activeTool === 'attach';

  const activateSelect = useCallback(() => setActiveTool('select'), []);
  const activatePan = useCallback(() => setActiveTool('pan'), []);
  const activatePencil = useCallback(() => setActiveTool(prev => prev === 'pencil' ? 'select' : 'pencil'), []);
  const activateEraser = useCallback(() => setActiveTool(prev => prev === 'eraser' ? 'select' : 'eraser'), []);
  const activateScissors = useCallback(() => setActiveTool(prev => prev === 'scissors' ? 'select' : 'scissors'), []);
  const activateText = useCallback(() => setActiveTool(prev => prev === 'text' ? 'select' : 'text'), []);
  const activateConnect = useCallback(() => setActiveTool(prev => prev === 'connect' ? 'select' : 'connect'), []);
  const activateCollage = useCallback(() => setActiveTool(prev => prev === 'collage' ? 'select' : 'collage'), []);
  const activateGroup = useCallback(() => setActiveTool(prev => prev === 'group' ? 'select' : 'group'), []);
  const activateAttach = useCallback(() => setActiveTool(prev => prev === 'attach' ? 'select' : 'attach'), []);

  return {
    activeTool,
    setActiveTool,
    // Flags
    isSelectActive,
    isPanActive,
    isPencilActive,
    isEraserActive,
    isScissorsActive,
    isTextActive,
    isConnectActive,
    isCollageActive,
    isGroupActive,
    isAttachActive,
    // Setters
    activateSelect,
    activatePan,
    activatePencil,
    activateEraser,
    activateScissors,
    activateText,
    activateConnect,
    activateCollage,
    activateGroup,
    activateAttach
  };
}

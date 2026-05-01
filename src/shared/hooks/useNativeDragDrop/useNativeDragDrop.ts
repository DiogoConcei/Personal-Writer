import { useEffect, useRef } from 'react';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

interface NativeDragDropOptions {
  /**
   * Callback disparado quando arquivos são soltos.
   * @param paths Lista de caminhos completos dos arquivos.
   * @param position Coordenadas (x, y) do drop na janela.
   */
  onDrop: (paths: string[], position: { x: number; y: number }) => Promise<void> | void;
  
  /**
   * Extensões permitidas (ex: ['.png', '.pdf']). Se vazio, permite tudo.
   */
  filters?: string[];
  
  /**
   * Se true, desativa o listener temporariamente.
   */
  disabled?: boolean;

  /**
   * Opcional: Se fornecido, o drop só será processado se a posição do mouse
   * estiver sobre um elemento que coincida com este seletor.
   */
  targetSelector?: string;
}

/**
 * Hook para capturar eventos de Drag & Drop nativos do Sistema Operacional (Desktop -> App).
 * Abstrai a API onDragDropEvent do Tauri.
 * 
 * KI-024: Fix race condition in async listener cleanup to prevent multiple triggers.
 */
export function useNativeDragDrop({ onDrop, filters = [], disabled = false, targetSelector }: NativeDragDropOptions) {
  // Usamos refs para evitar que mudanças nas funções/arrays de filtros causem re-registros do listener
  const onDropRef = useRef(onDrop);
  const filtersRef = useRef(filters);
  const targetSelectorRef = useRef(targetSelector);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    targetSelectorRef.current = targetSelector;
  }, [targetSelector]);

  useEffect(() => {
    if (disabled) return;

    const appWindow = getCurrentWebviewWindow();
    let unlistenFn: (() => void) | undefined;
    let isCancelled = false;

    const setupListener = async () => {
      const unlisten = await appWindow.onDragDropEvent(async (event) => {
        if (event.payload.type === 'drop') {
          const { x, y } = event.payload.position;

          // Validação de Target Selector (Seletor de Destino)
          if (targetSelectorRef.current) {
            const elementAtPoint = document.elementFromPoint(x, y);
            const hasTarget = elementAtPoint?.closest(targetSelectorRef.current);
            if (!hasTarget) return; // Ignora drop fora do alvo específico
          }

          const allPaths = event.payload.paths;
          const currentFilters = filtersRef.current;
          
          // Filtra extensões se necessário
          const filteredPaths = currentFilters.length > 0 
            ? allPaths.filter(p => currentFilters.some(ext => p.toLowerCase().endsWith(ext.toLowerCase())))
            : allPaths;

          if (filteredPaths.length > 0) {
            await onDropRef.current(filteredPaths, event.payload.position);
          }
        }
      });

      if (isCancelled) {
        unlisten();
      } else {
        unlistenFn = unlisten;
      }
    };

    setupListener();

    return () => {
      isCancelled = true;
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [disabled]); // Só re-roda se mudar o estado de desativado
}

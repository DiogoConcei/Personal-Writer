import { useEffect } from 'react';
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
}

/**
 * Hook para capturar eventos de Drag & Drop nativos do Sistema Operacional (Desktop -> App).
 * Abstrai a API onDragDropEvent do Tauri.
 */
export function useNativeDragDrop({ onDrop, filters = [], disabled = false }: NativeDragDropOptions) {
  useEffect(() => {
    if (disabled) return;

    const appWindow = getCurrentWebviewWindow();
    let unlistenFn: (() => void) | undefined;

    const setupListener = async () => {
      unlistenFn = await appWindow.onDragDropEvent(async (event) => {
        if (event.payload.type === 'drop') {
          const allPaths = event.payload.paths;
          
          // Filtra extensões se necessário
          const filteredPaths = filters.length > 0 
            ? allPaths.filter(p => filters.some(ext => p.toLowerCase().endsWith(ext.toLowerCase())))
            : allPaths;

          if (filteredPaths.length > 0) {
            await onDrop(filteredPaths, event.payload.position);
          }
        }
      });
    };

    setupListener();

    return () => {
      if (unlistenFn) unlistenFn();
    };
  }, [onDrop, filters, disabled]);
}

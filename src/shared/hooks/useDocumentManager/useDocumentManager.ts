import { useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useReferenceStore } from '@/features/references/store/referenceStore';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export function useDocumentManager() {
  const { rootPath } = useWorkspaceStore();
  const { 
    pdfs, 
    isLoadingPdfs, 
    fetchPdfs, 
    handleUpload, 
    handleDelete 
  } = useReferenceStore();

  const loadDocuments = useCallback(async () => {
    if (rootPath) {
      await fetchPdfs(rootPath);
    }
  }, [rootPath, fetchPdfs]);

  // Listener para Drag & Drop Externo (Desktop -> App)
  useEffect(() => {
    if (!rootPath) return;

    const appWindow = getCurrentWebviewWindow();
    let unlistenFn: (() => void) | undefined;

    const setupDragDrop = async () => {
      unlistenFn = await appWindow.onDragDropEvent(async (event) => {
        if (event.payload.type === 'drop') {
          const pdfPaths = event.payload.paths.filter(p => p.toLowerCase().endsWith('.pdf'));
          if (pdfPaths.length > 0) {
            await handleUpload(pdfPaths);
          }
        }
      });
    };

    setupDragDrop();
    return () => { if (unlistenFn) unlistenFn(); };
  }, [rootPath, handleUpload]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  return {
    pdfs,
    isLoading: isLoadingPdfs,
    loadDocuments,
    handleUpload,
    handleDelete
  };
}

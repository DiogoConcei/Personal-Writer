import { useState, useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useUIStore } from '@/store/uiStore';
import { scanWorkspacePdfs, PdfAsset, copyFileToWorkspace, deleteItem } from '@/tauri-bridge/fs';
import { open } from '@tauri-apps/plugin-dialog';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

export function useDocumentManager() {
  const { rootPath } = useWorkspaceStore();
  const { addNotification } = useUIStore();
  
  const [pdfs, setPdfs] = useState<PdfAsset[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    if (!rootPath) return;
    setIsLoading(true);
    try {
      const allPdfs = await scanWorkspacePdfs(rootPath);
      setPdfs(allPdfs);
    } catch (err) {
      console.error('[useDocumentManager] Erro ao carregar PDFs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [rootPath]);

  const handleUpload = useCallback(async (externalPaths?: string[]) => {
    if (!rootPath) return;
    
    try {
      let pathsToImport: string[] = [];

      if (externalPaths && externalPaths.length > 0) {
        pathsToImport = externalPaths;
      } else {
        const selected = await open({
          multiple: true,
          filters: [{ name: 'Documentos PDF', extensions: ['pdf'] }]
        });
        if (selected) {
          pathsToImport = Array.isArray(selected) ? selected : [selected];
        }
      }

      if (pathsToImport.length === 0) return;

      setIsLoading(true);
      for (const path of pathsToImport) {
        // Salva na pasta 'docs' por padrão para organização
        await copyFileToWorkspace(path, rootPath, 'docs');
      }
      
      addNotification(`${pathsToImport.length} documento(s) importado(s)`, 'success');
      await loadDocuments();
      return true;
    } catch (err) {
      console.error('[useDocumentManager] Erro no upload:', err);
      addNotification('Erro ao importar documentos', 'error');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [rootPath, loadDocuments, addNotification]);

  const handleDelete = useCallback(async (pdf: PdfAsset) => {
    try {
      await deleteItem(pdf.full_path);
      addNotification('Documento excluído com sucesso', 'success');
      await loadDocuments();
      return true;
    } catch (err) {
      console.error('[useDocumentManager] Erro ao excluir PDF:', err);
      addNotification('Erro ao excluir documento', 'error');
      return false;
    }
  }, [loadDocuments, addNotification]);

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
    isLoading,
    loadDocuments,
    handleUpload,
    handleDelete
  };
}

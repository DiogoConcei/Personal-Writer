import { useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';
import { useReferenceStore } from '@/features/references/store/referenceStore';

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

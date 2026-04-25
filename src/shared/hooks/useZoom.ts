import { useState, useCallback } from 'react';

interface UseZoomOptions {
  initialZoom?: number;
  minZoom?: number;
  maxZoom?: number;
  step?: number;
}

/**
 * Hook desacoplado para controle de zoom/escala.
 * Pode ser utilizado em visualizadores de imagem, canvas ou qualquer componente escalável.
 */
export function useZoom({
  initialZoom = 1,
  minZoom = 0.1,
  maxZoom = 5,
  step = 0.2
}: UseZoomOptions = {}) {
  const [zoom, setZoom] = useState(initialZoom);

  const zoomIn = useCallback(() => {
    setZoom(prev => {
      const next = prev + step;
      return next <= maxZoom ? Number(next.toFixed(2)) : maxZoom;
    });
  }, [maxZoom, step]);

  const zoomOut = useCallback(() => {
    setZoom(prev => {
      const next = prev - step;
      return next >= minZoom ? Number(next.toFixed(2)) : minZoom;
    });
  }, [minZoom, step]);

  const resetZoom = useCallback(() => {
    setZoom(initialZoom);
  }, [initialZoom]);

  return {
    zoom,
    setZoom,
    zoomIn,
    zoomOut,
    resetZoom
  };
}

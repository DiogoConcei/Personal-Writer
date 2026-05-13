import html2canvas from 'html2canvas';
import { CropOptions, Point } from '@/shared/types';

/**
 * Utilitário resiliente para processar o recorte de uma área da tela.
 * Converte a área selecionada em uma imagem PNG Base64.
 * Utiliza html2canvas com reset de escala para precisão total.
 */
export async function processCanvasCrop({ points, boundingBox, container }: CropOptions): Promise<string | null> {
  try {
    // Adicionar marcador temporário para identificar o container no clone
    container.setAttribute('data-cropping-root', 'true');

    // 1. Capturar o conteúdo usando html2canvas
    const sourceCanvas = await html2canvas(container, {
      backgroundColor: null, // Manter transparência
      scale: 2, // Resolução 2x para nitidez
      useCORS: true,
      logging: false,
      // CRITICAL: Resetar transformações no clone para garantir que 1px lógico = 1px no canvas
      onclone: (clonedDoc) => {
        const el = clonedDoc.querySelector('[data-cropping-root="true"]') as HTMLElement;
        if (el) {
          el.style.transform = 'none';
          el.style.transformOrigin = 'top left';
          el.style.left = '0';
          el.style.top = '0';
        }
      },
      ignoreElements: (node) => {
        const el = node as HTMLElement;
        const className = typeof el.className === 'string' ? el.className : '';
        
        return (
          className.includes('cutActionMenu') || 
          className.includes('closeBtn') ||
          className.includes('selectionLayer') ||
          className.includes('activeOverlay') ||
          className.includes('handle') ||
          className.includes('toolbar')
        );
      }
    });

    // Limpar o marcador
    container.removeAttribute('data-cropping-root');

    if (!sourceCanvas) return null;

    return extractArea(sourceCanvas, points, boundingBox, 2);
  } catch (err) {
    console.error('Erro fatal ao processar recorte:', err);
    // Limpeza de segurança em caso de erro
    container.removeAttribute('data-cropping-root');
    return null;
  }
}

/**
 * Recorta a área final do canvas capturado com precisão de sub-pixel.
 */
function extractArea(
  sourceCanvas: HTMLCanvasElement, 
  points: Point[], 
  boundingBox: { x: number, y: number, width: number, height: number },
  renderScale: number
): string | null {
  const destCanvas = document.createElement('canvas');
  const ctx = destCanvas.getContext('2d');
  if (!ctx) return null;

  // Dimensões do recorte final em pixels de renderização
  const destWidth = Math.round(boundingBox.width * renderScale);
  const destHeight = Math.round(boundingBox.height * renderScale);

  destCanvas.width = destWidth;
  destCanvas.height = destHeight;

  ctx.clearRect(0, 0, destWidth, destHeight);

  // Aplicar máscara de recorte livre (Lasso)
  if (points && points.length > 2) {
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => {
      const relX = (p.x - boundingBox.x) * renderScale;
      const relY = (p.y - boundingBox.y) * renderScale;
      if (i === 0) ctx.moveTo(relX, relY);
      else ctx.lineTo(relX, relY);
    });
    ctx.closePath();
    ctx.clip();
  }

  // Desenhar a sub-área do sourceCanvas
  // O html2canvas já aplicou o renderScale (scale: 2) no sourceCanvas
  ctx.drawImage(
    sourceCanvas,
    Math.round(boundingBox.x * renderScale),
    Math.round(boundingBox.y * renderScale),
    destWidth,
    destHeight,
    0,
    0,
    destWidth,
    destHeight
  );

  if (points && points.length > 2) {
    ctx.restore();
  }

  return destCanvas.toDataURL('image/png');
}

import { toCanvas } from 'html-to-image';
import { Point } from '../hooks/useScissorsTrace';

interface CropOptions {
  points: Point[];
  boundingBox: { x: number; y: number; width: number; height: number };
  container: HTMLElement;
}

/**
 * Utilitário resiliente para processar o recorte de uma área da tela.
 * Converte a área selecionada em uma imagem PNG Base64.
 */
export async function processCanvasCrop({ points, boundingBox, container }: CropOptions): Promise<string | null> {
  try {
    const logicalWidth = parseFloat(container.style.width) || container.offsetWidth;
    const logicalHeight = parseFloat(container.style.height) || container.offsetHeight;

    // 1. Tentar capturar o conteúdo. 
    // Usamos um timeout e capturamos erros de recursos individuais para não travar o processo.
    const sourceCanvas = await toCanvas(container, {
      width: logicalWidth,
      height: logicalHeight,
      pixelRatio: 2,
      skipAutoScale: true,
      cacheBust: true,
      // Se uma imagem ou fonte falhar, o processo continua sem ela em vez de lançar erro
      imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 
      filter: (node) => {
        const el = node as HTMLElement;
        const classList = el.classList;
        if (classList && (
          classList.contains('cutActionMenu') || 
          classList.contains('closeBtn') ||
          classList.contains('selectionLayer') ||
          classList.contains('activeOverlay') ||
          classList.contains('handle') // Remover alças de redimensionamento
        )) {
          return false;
        }
        return true;
      }
    }).catch(err => {
      console.error('Falha na captura primária do html-to-image:', err);
      // Fallback: Tentar capturar apenas o que for canvas/img direto se o clone falhar
      return null;
    });

    if (!sourceCanvas) {
      // Estratégia de Fallback: Captura manual de elementos Canvas (PDF) ou Imagem
      const fallbackCanvas = document.createElement('canvas');
      const fCtx = fallbackCanvas.getContext('2d');
      const target = container.querySelector('canvas, img');
      
      if (target && fCtx) {
        const renderScale = 2;
        fallbackCanvas.width = logicalWidth * renderScale;
        fallbackCanvas.height = logicalHeight * renderScale;
        
        if (target instanceof HTMLCanvasElement) {
          fCtx.drawImage(target, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
        } else if (target instanceof HTMLImageElement) {
          fCtx.drawImage(target, 0, 0, fallbackCanvas.width, fallbackCanvas.height);
        }
        return extractArea(fallbackCanvas, points, boundingBox, renderScale);
      }
      return null;
    }

    return extractArea(sourceCanvas, points, boundingBox, 2);
  } catch (err) {
    console.error('Erro fatal ao processar recorte:', err);
    return null;
  }
}

/**
 * Recorta a área final do canvas capturado.
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

  destCanvas.width = boundingBox.width * renderScale;
  destCanvas.height = boundingBox.height * renderScale;

  // Aplicar máscara de recorte livre
  if (points.length > 2) {
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

  ctx.drawImage(
    sourceCanvas,
    boundingBox.x * renderScale,
    boundingBox.y * renderScale,
    boundingBox.width * renderScale,
    boundingBox.height * renderScale,
    0,
    0,
    boundingBox.width * renderScale,
    boundingBox.height * renderScale
  );

  return destCanvas.toDataURL('image/png');
}

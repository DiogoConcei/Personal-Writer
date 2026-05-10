import { Point } from '../hooks/useScissorsTrace';

interface CropOptions {
  points: Point[];
  boundingBox: { x: number; y: number; width: number; height: number };
  container: HTMLElement;
}

/**
 * Utilitário para processar o recorte de uma área da tela.
 * Converte a área selecionada em uma imagem Base64.
 */
export async function processCanvasCrop({ points, boundingBox, container }: CropOptions): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(null);

      // 1. Definir tamanho do canvas baseado na bounding box
      const scale = window.devicePixelRatio || 1;
      canvas.width = boundingBox.width * scale;
      canvas.height = boundingBox.height * scale;
      ctx.scale(scale, scale);

      // 2. Criar o caminho de recorte (Clip Path)
      ctx.beginPath();
      if (points.length === 2) {
        // Modo Quadrado
        ctx.rect(0, 0, boundingBox.width, boundingBox.height);
      } else {
        // Modo Livre (Tesoura)
        // Ajustamos os pontos para serem relativos ao topo-esquerda da bounding box
        points.forEach((p, i) => {
          const relX = p.x - boundingBox.x;
          const relY = p.y - boundingBox.y;
          if (i === 0) ctx.moveTo(relX, relY);
          else ctx.lineTo(relX, relY);
        });
      }
      ctx.closePath();
      ctx.clip();

      // 3. Capturar o conteúdo do container
      // Nota: Como não temos html2canvas, para elementos HTML complexos (notas)
      // precisaríamos de uma técnica de SVG foreignObject.
      // Para simplificar esta primeira versão, vamos focar em capturar o que é IMAGEM ou PDF (canvas).
      
      const targetElement = container.querySelector('img, canvas') as HTMLImageElement | HTMLCanvasElement;
      
      if (targetElement) {
        const processDraw = async (source: HTMLImageElement | HTMLCanvasElement) => {
          try {
            const sourceRect = targetElement.getBoundingClientRect();
            const containerRect = container.getBoundingClientRect();
            
            const offsetX = sourceRect.left - containerRect.left;
            const offsetY = sourceRect.top - containerRect.top;

            // Usar createImageBitmap para garantir que a imagem está decodificada e pronta
            // Isso resolve problemas de "broken state" em muitos navegadores
            const bitmap = await createImageBitmap(source, {
              resizeQuality: 'high'
            });

            ctx.drawImage(
              bitmap,
              boundingBox.x - offsetX,
              boundingBox.y - offsetY,
              boundingBox.width,
              boundingBox.height,
              0,
              0,
              boundingBox.width,
              boundingBox.height
            );
            
            resolve(canvas.toDataURL('image/png'));
          } catch (err) {
            console.error('Erro na renderização do bitmap:', err);
            // Fallback para drawImage direto se o bitmap falhar
            try {
              ctx.drawImage(source, 0, 0); // simplificado para teste se chegar aqui
              resolve(canvas.toDataURL('image/png'));
            } catch (e) {
              resolve(null);
            }
          }
        };

        if (targetElement instanceof HTMLImageElement) {
          if (targetElement.complete && targetElement.naturalWidth > 0) {
            processDraw(targetElement);
          } else {
            targetElement.onload = () => processDraw(targetElement);
            targetElement.onerror = () => resolve(null);
          }
        } else {
          processDraw(targetElement);
        }
      } else {
        // Para Notas (HTML puro), precisaremos de uma implementação mais complexa
        // ou avisar que o recorte de texto livre ainda está em desenvolvimento.
        console.warn('Recorte de elementos HTML puros ainda não suportado sem bibliotecas externas.');
        resolve(null);
      }
    } catch (err) {
      console.error('Erro ao processar recorte:', err);
      resolve(null);
    }
  });
}

import { AnyCanvasEntity, SplitActionData } from '@/shared/types';

/**
 * Calcula as novas entidades resultantes de um corte (split) de uma nota ou PDF.
 * Esta é uma função pura, agnóstica de estado do React.
 */
export function calculateSplitEntities(
  original: AnyCanvasEntity,
  data: SplitActionData,
  currentEntityCount: number
): AnyCanvasEntity[] {
  if (original.type !== 'pdf' && original.type !== 'note') return [];

  const originalData = original.data as any;
  const blockStartPage = originalData.startPage || 1;
  const blockEndPage = originalData.endPage || originalData.totalPages || 1;

  let pagesToExtract: number[] = [];

  // 1. Mapeamento de páginas relativas para absolutas
  if (data.mode === 'amount' && data.startPage !== undefined && data.amount !== undefined) {
    const relativeStart = data.startPage;
    const absoluteStart = blockStartPage + (relativeStart - 1);

    for (let i = 0; i < data.amount; i++) {
      const page = absoluteStart + i;
      if (page <= blockEndPage) pagesToExtract.push(page);
    }
  } else if (data.mode === 'single' && data.singlePage !== undefined) {
    const absolutePage = blockStartPage + (data.singlePage - 1);
    if (absolutePage <= blockEndPage) {
      pagesToExtract.push(absolutePage);
    }
  } else if (data.mode === 'range' && data.startPage !== undefined && data.endPage !== undefined) {
    const absoluteStart = blockStartPage + (data.startPage - 1);
    const absoluteEnd = blockStartPage + (data.endPage - 1);

    for (let i = absoluteStart; i <= absoluteEnd; i++) {
      if (i >= blockStartPage && i <= blockEndPage) pagesToExtract.push(i);
    }
  }

  if (pagesToExtract.length === 0) return [];

  const minExtracted = Math.min(...pagesToExtract);
  const maxExtracted = Math.max(...pagesToExtract);

  const newEntities: AnyCanvasEntity[] = [];
  let offsetCount = 1;

  // 2. Bloco da Esquerda (Remanescente anterior)
  if (minExtracted > blockStartPage) {
    newEntities.push({
      ...original,
      id: `${original.type}-left-${Math.random().toString(36).substring(2, 9)}`,
      data: {
        ...originalData,
        startPage: blockStartPage,
        endPage: minExtracted - 1,
      },
    });
  }

  // 3. Páginas Extraídas (Individuais ou Bloco único se for range?)
  // Nota: O código original cria entidades individuais para CADA página em pagesToExtract.
  pagesToExtract.forEach((pageNum) => {
    newEntities.push({
      id: `${original.type}-page-${Math.random().toString(36).substring(2, 9)}`,
      type: original.type,
      x: original.x + (original.width || 250) + 40,
      y: original.y + (offsetCount - 1) * 40,
      width: original.width,
      height: original.height,
      rotation: 0,
      zIndex: currentEntityCount + offsetCount,
      data: {
        ...originalData,
        startPage: pageNum,
        endPage: pageNum,
      },
    });
    offsetCount++;
  });

  // 4. Bloco da Direita (Remanescente posterior)
  if (maxExtracted < blockEndPage) {
    newEntities.push({
      ...original,
      id: `${original.type}-right-${Math.random().toString(36).substring(2, 9)}`,
      x: original.x,
      y: original.y + (original.height || 400) + 40,
      data: {
        ...originalData,
        startPage: maxExtracted + 1,
        endPage: blockEndPage,
      },
    });
  }

  return newEntities;
}

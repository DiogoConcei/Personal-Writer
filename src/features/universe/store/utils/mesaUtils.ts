import { MesaItem, MesaGrupo } from '@/shared/types';

/**
 * Calcula a posição média de um conjunto de itens.
 */
export const calculateAveragePosition = (items: MesaItem[]) => {
  if (items.length === 0) return { x: 0, y: 0 };
  const sumX = items.reduce((acc, i) => acc + i.x, 0);
  const sumY = items.reduce((acc, i) => acc + i.y, 0);
  return {
    x: sumX / items.length,
    y: sumY / items.length
  };
};

/**
 * Retorna o maior zIndex entre itens e grupos.
 */
export const getMaxZIndex = (items: MesaItem[], groups: MesaGrupo[]) => {
  const allZ = [
    ...items.map(i => i.zIndex || 0),
    ...groups.map(g => g.zIndex || 0)
  ];
  return allZ.length > 0 ? Math.max(...allZ) : 0;
};

/**
 * Consolida caminhos extras de itens para fusão em galeria (Modo Planejamento).
 */
export const consolidateExtraPaths = (primaryItem: MesaItem, otherItems: MesaItem[]) => {
  const newExtraPaths = [...(primaryItem.extraPaths || [])];
  otherItems.forEach(item => {
    if (item.path) newExtraPaths.push(item.path);
    if (item.extraPaths) {
      newExtraPaths.push(...item.extraPaths);
    }
  });
  return Array.from(new Set(newExtraPaths));
};

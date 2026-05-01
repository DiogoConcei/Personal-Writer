/**
 * Verifica se uma coordenada (x, y) está dentro dos limites de um elemento do DOM.
 */
export function isCoordinateInsideElement(x: number, y: number, selector: string): boolean {
  const element = document.querySelector(selector);
  if (!element) return false;
  
  const rect = element.getBoundingClientRect();
  return (
    x >= rect.left &&
    x <= rect.right &&
    y >= rect.top &&
    y <= rect.bottom
  );
}

/**
 * Calcula a posição do cursor (index) no editor TipTap baseada em coordenadas do mouse.
 * Se não for possível determinar, retorna o fim do documento.
 */
export function getPosAtCoords(editor: any, x: number, y: number): number {
  if (!editor) return 0;
  const coordinates = editor.view.posAtCoords({ left: x, top: y });
  return coordinates ? coordinates.pos : editor.state.doc.content.size;
}

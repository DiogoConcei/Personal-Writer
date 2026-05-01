/**
 * Utilitários para manipulação e análise de strings.
 */

/**
 * Conta o número de palavras em um texto, ignorando espaços extras.
 */
export function countWords(text: string | null | undefined): number {
  if (!text) return 0;
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/**
 * Normaliza quebras de linha e espaços para processamento.
 */
export function normalizeText(text: string): string {
  return text.replace(/\r\n/g, "\n").trim();
}

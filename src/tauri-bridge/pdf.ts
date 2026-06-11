import { invoke } from "@tauri-apps/api/core";

/**
 * Exporta a janela atual do WebView para um arquivo PDF no caminho especificado.
 * (Apenas Windows)
 */
export async function exportPdf(path: string): Promise<void> {
  return await invoke("export_pdf", { path });
}

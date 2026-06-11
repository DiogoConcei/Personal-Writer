use tauri::Runtime;
use tauri::WebviewWindow;

#[cfg(windows)]
use webview2_com::Microsoft::Web::WebView2::Win32::ICoreWebView2_7;
#[cfg(windows)]
use windows::core::Interface;
#[cfg(windows)]
use windows::core::PCWSTR;

#[tauri::command]
pub async fn export_pdf<R: Runtime>(window: WebviewWindow<R>, path: String) -> Result<(), String> {
    #[cfg(windows)]
    {
        let (tx, rx) = tokio::sync::oneshot::channel();
        
        window.with_webview(move |webview| {
            unsafe {
                let result = (|| -> Result<(), String> {
                    let core = webview.controller().CoreWebView2().map_err(|e| e.to_string())?;
                    let core7: ICoreWebView2_7 = core.cast().map_err(|e| e.to_string())?;
                    
                    let path_u16: Vec<u16> = path.encode_utf16().chain(std::iter::once(0)).collect();
                    let pcwstr = PCWSTR::from_raw(path_u16.as_ptr());

                    core7.PrintToPdf(pcwstr, None, None).map_err(|e| e.to_string())
                })();
                let _ = tx.send(result);
            }
        }).map_err(|e| e.to_string())?;
        
        rx.await.map_err(|_| "Falha ao receber resultado do webview".to_string())?
    }

    #[cfg(not(windows))]
    {
        let _ = (window, path);
        Err("O PDF export é suportado apenas no Windows no momento.".to_string())
    }
}

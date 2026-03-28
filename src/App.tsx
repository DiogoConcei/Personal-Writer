import { useState, useEffect } from "react";
import { 
  FilePlus, 
  FileText, 
  Save, 
  Settings, 
  Circle,
  Menu,
  ChevronRight
} from "lucide-react";
import { open, save } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import "./App.css";

function App() {
  const [content, setContent] = useState("");
  const [filePath, setFilePath] = useState<string | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [fileName, setFileName] = useState("Untitled");

  useEffect(() => {
    if (filePath) {
      const name = filePath.split(/[/\\]/).pop() || "Untitled";
      setFileName(name);
    } else {
      setFileName("Untitled");
    }
  }, [filePath]);

  const handleNew = () => {
    if (isModified) {
      const confirm = window.confirm("You have unsaved changes. Create new anyway?");
      if (!confirm) return;
    }
    setContent("");
    setFilePath(null);
    setIsModified(false);
  };

  const handleOpen = async () => {
    try {
      const selected = await open({
        multiple: false,
        filters: [{
          name: 'Text Files',
          extensions: ['txt', 'md', 'js', 'ts', 'json', 'css', 'html']
        }]
      });

      if (selected && !Array.isArray(selected)) {
        const text = await readTextFile(selected);
        setContent(text);
        setFilePath(selected);
        setIsModified(false);
      }
    } catch (err) {
      console.error("Failed to open file:", err);
      alert("Error opening file. Check permissions.");
    }
  };

  const handleSave = async () => {
    if (!filePath) {
      return handleSaveAs();
    }

    try {
      await writeTextFile(filePath, content);
      setIsModified(false);
    } catch (err) {
      console.error("Failed to save file:", err);
      alert("Error saving file.");
    }
  };

  const handleSaveAs = async () => {
    try {
      const selected = await save({
        filters: [{
          name: 'Text Files',
          extensions: ['txt', 'md', 'js', 'ts', 'json', 'css', 'html']
        }]
      });

      if (selected) {
        await writeTextFile(selected, content);
        setFilePath(selected);
        setIsModified(false);
      }
    } catch (err) {
      console.error("Failed to save as:", err);
      alert("Error saving file.");
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Nova Editor</h2>
        </div>

        <nav className="sidebar-menu">
          <div className="menu-item" onClick={handleNew}>
            <FilePlus />
            <span>New File</span>
          </div>
          <div className="menu-item" onClick={handleOpen}>
            <FileText />
            <span>Open File</span>
          </div>
          <div className="menu-item" onClick={handleSave}>
            <Save />
            <span>Save</span>
          </div>
          <div className="menu-item" onClick={handleSaveAs}>
            <Circle size={18} fill={isModified ? "var(--accent-color)" : "transparent"} stroke={isModified ? "var(--accent-color)" : "currentColor"} />
            <span>Save As...</span>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="menu-item">
            <Settings />
            <span>Settings</span>
          </div>
          <div style={{ marginTop: '15px', padding: '0 12px', fontSize: '11px' }}>
            v0.1.0 • Built with Tauri
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="editor-header">
          <div className="file-info">
            <Menu size={18} style={{ marginRight: '10px', cursor: 'pointer' }} />
            <span className="file-name">{fileName}</span>
            {isModified && <span className="status-badge">Modified</span>}
          </div>
          <div className="actions">
            <ChevronRight size={18} />
          </div>
        </header>

        <div className="editor-container">
          <textarea
            className="editor-textarea"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsModified(true);
            }}
            placeholder="Start typing something beautiful..."
            spellCheck={false}
          />
        </div>
      </main>
    </div>
  );
}

export default App;

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontFamily } from "@tiptap/extension-font-family";
import { Extension } from "@tiptap/core";

// Extensões Locais/Customizadas
import { WikiLink } from "../extensions/WikiLink/WikiLink";
import { CustomImage } from "../extensions/Image/Image";
import { CustomCodeBlock } from "../extensions/CodeBlock/CodeBlock";
import { PdfLink } from "../extensions/PdfLink/PdfLink";
import { FontSize } from "../extensions/FontSize";
import { Spelling } from "../extensions/Spelling";
import { SlashCommand } from "@/features/SlashMenu/extensions/SlashCommand";
import { getMathExtension } from "../extensions/MathExtension";
import { renderSlashMenuPopup } from "@/features/SlashMenu/utils/renderPopup";

// Stores e Utils
import { useWorkspaceStore } from "@/features/workspace/store/workspaceStore";
import { usePluginStore } from "@/features/settings/store/pluginStore";
import { findFileInTree } from "@/shared/utils/files";
import { getRelativeSubfolder } from "@/shared/utils/path";
import { saveImageFromBytes } from "@/tauri-bridge";
import typographyStyles from "../components/Core/Editor/EditorTypography.module.scss";

/**
 * Extensão customizada para permitir indentação com a tecla Tab
 */
const IndentExtension = Extension.create({
  name: "indentExtension",
  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.insertContent("\t"),
    };
  },
});

interface UseEditorSetupOptions {
  onUpdate: (props: { editor: any }) => void;
}

/**
 * Hook especializado para configurar o editor TipTap com todas as extensões e lógicas de eventos.
 * Extrai a complexidade do componente principal Editor.tsx.
 */
export function useEditorSetup({ onUpdate }: UseEditorSetupOptions) {
  const { activeFile, rootPath } = useWorkspaceStore();
  const { plugins } = usePluginStore();

  const isMathEnabled = plugins.find((p) => p.id === "latex-math")?.status === "enabled";

  const editor = useEditor(
    {
      extensions: [
        StarterKit.configure({ codeBlock: false }),
        IndentExtension,
        CustomCodeBlock,
        Markdown.configure({
          html: true,
          tightLists: true,
          linkify: true,
        }),
        BubbleMenu,
        TextStyle,
        FontFamily,
        FontSize,
        Spelling.configure({ debounce: 150 }),
        isMathEnabled ? getMathExtension() : null,
        WikiLink.configure({
          onLinkClick: (noteName: string) => {
            const file = findFileInTree(useWorkspaceStore.getState().files, noteName);
            if (file) useWorkspaceStore.getState().setActiveFile(file.path);
            else useWorkspaceStore.getState().createFile(noteName);
          },
        } as any),
        CustomImage.configure({ inline: true, allowBase64: true }),
        PdfLink,
        SlashCommand.configure({
          suggestion: {
            render: renderSlashMenuPopup,
          },
        }),
      ].filter(Boolean) as any,
      content: "",
      onUpdate,
      editorProps: {
        attributes: {
          class: typographyStyles.prose,
          spellcheck: "false",
          lang: "pt-BR",
        },
        handlePaste: (view, event) => {
          const items = Array.from(event.clipboardData?.items || []);
          const imageItem = items.find((item) => item.type.startsWith("image"));

          if (imageItem && rootPath && activeFile) {
            const file = imageItem.getAsFile();
            if (file) {
              event.preventDefault();
              const reader = new FileReader();
              reader.onload = async (e) => {
                const buffer = e.target?.result as ArrayBuffer;
                const bytes = Array.from(new Uint8Array(buffer));
                const fileName = `pasted_${Date.now()}.png`;
                const subFolder = getRelativeSubfolder(activeFile, rootPath);
                try {
                  const relativePath = await saveImageFromBytes(
                    fileName,
                    bytes,
                    rootPath,
                    subFolder,
                  );
                  view.dispatch(
                    view.state.tr.replaceSelectionWith(
                      view.state.schema.nodes.image.create({
                        src: relativePath,
                      }),
                    ),
                  );
                } catch (err) {
                  console.error("Erro ao salvar imagem colada:", err);
                }
              };
              reader.readAsArrayBuffer(file);
              return true;
            }
          }
          return false;
        },
      },
    },
    [rootPath],
  );

  return editor;
}

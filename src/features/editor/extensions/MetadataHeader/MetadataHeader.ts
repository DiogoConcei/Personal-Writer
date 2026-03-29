import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import MetadataHeaderNode from './MetadataHeaderNode';

// Função auxiliar para extrair dados do YAML sem depender de bibliotecas externas
const parseYAML = (yaml: string) => {
  const data: any = { fields: {} };
  const typeMatch = yaml.match(/type:\s*["']?([^"'\r\n]+)["']?/i);
  const iconMatch = yaml.match(/icon:\s*["']?([^"'\r\n]+)["']?/i);
  
  if (typeMatch) data.type = typeMatch[1].trim();
  if (iconMatch) data.icon = iconMatch[1].trim();

  const fieldsBlock = yaml.match(/fields:\r?\n([\s\S]*?)(?=\r?\n[a-z]|$)/i);
  if (fieldsBlock) {
    const lines = fieldsBlock[1].split('\n');
    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim().replace(/["']/g, '');
        if (k) data.fields[k] = isNaN(Number(v)) ? v : Number(v);
      }
    });
  }
  return data;
};

export const MetadataHeader = Node.create({
  name: 'metadataHeader',
  group: 'block',
  atom: true, 
  selectable: false,
  draggable: false,

  addAttributes() {
    return {
      content: {
        default: '',
        parseHTML: element => element.getAttribute('data-content'),
        renderHTML: attributes => ({
          'data-content': attributes.content,
        }),
      },
      data: {
        default: {},
        // RECONSTRUÇÃO CRÍTICA: Se o data vier vazio (como no load de HTML), 
        // tentamos reconstruir a partir do atributo content (YAML)
        parseHTML: element => {
          const yaml = element.getAttribute('data-content');
          return yaml ? parseYAML(yaml) : {};
        }
      }
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('preventMetadataDeletion'),
        filterTransaction: (tr, state) => {
          const currentHeaderCount = state.doc.content.firstChild?.type.name === 'metadataHeader' ? 1 : 0;
          const nextHeaderCount = tr.doc.content.firstChild?.type.name === 'metadataHeader' ? 1 : 0;
          
          if (currentHeaderCount === 1 && nextHeaderCount === 0) {
            return false;
          }
          return true;
        },
      }),
    ];
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        if ($from.pos <= 2) return true;
        return false;
      },
      Delete: () => {
        const { state } = this.editor;
        const { selection } = state;
        const { $from } = selection;
        if ($from.pos === 0) return true;
        return false;
      },
    };
  },

  parseHTML() {
    return [{ tag: 'div[data-type="metadata-header"]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'metadata-header' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(MetadataHeaderNode);
  },
});

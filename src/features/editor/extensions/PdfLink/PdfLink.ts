import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { PdfNode } from './PdfNode';

export const PdfLink = Node.create({
  name: 'pdfLink',
  group: 'inline',
  inline: true,
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      path: {
        default: null,
      },
      name: {
        default: 'Documento PDF',
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-pdf-path]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes, { 'data-pdf-path': '' })];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`[PDF: ${node.attrs.name}](${node.attrs.path})`);
        },
        parse: {
          setup(markdownit: any) {
            markdownit.inline.ruler.before('link', 'pdf_link', (state: any, silent: boolean) => {
              const start = state.pos;
              if (state.src.charCodeAt(start) !== 0x5B /* [ */) return false;

              const match = state.src.slice(start).match(/^\[PDF: ([^\]]+)\]\(([^)]+)\)/);
              if (!match) return false;

              if (!silent) {
                const token = state.push('pdf_link_open', 'span', 1);
                token.attrs = [['data-pdf-path', ''], ['path', match[2]], ['name', match[1]]];
                
                const textToken = state.push('text', '', 0);
                textToken.content = match[1];
                
                state.push('pdf_link_close', 'span', -1);
              }

              state.pos += match[0].length;
              return true;
            });
          }
        }
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(PdfNode);
  },
});

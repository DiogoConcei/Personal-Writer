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

  addNodeView() {
    return ReactNodeViewRenderer(PdfNode);
  },
});

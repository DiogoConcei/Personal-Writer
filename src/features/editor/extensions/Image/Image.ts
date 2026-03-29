import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNode from './ImageNode';

export const CustomImage = Image.extend({
  // Permite que a imagem seja renderizada dentro de parágrafos (inline)
  inline: true,
  group: 'inline',

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '300px',
        renderHTML: attributes => ({
          style: `width: ${attributes.width}; height: auto;`,
        }),
      },
      layout: {
        default: 'inline', // 'inline', 'wrap-left', 'wrap-right'
        renderHTML: attributes => ({
          'data-layout': attributes.layout,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNode);
  },
});

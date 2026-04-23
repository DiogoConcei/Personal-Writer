import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNode from './ImageNode';

export const CustomImage = Image.extend({

  inline: true,
  group: 'inline',
  draggable: true,

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
        default: 'inline',
        renderHTML: attributes => ({
          'data-layout': attributes.layout,
        }),
      },
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          // Fallback para HTML se houver atributos customizados que o markdown não suporta
          if (node.attrs.width !== '300px' || node.attrs.layout !== 'inline') {
            state.write(`<img src="${node.attrs.src}" alt="${node.attrs.alt || ''}" width="${node.attrs.width}" data-layout="${node.attrs.layout}" />`);
          } else {
            state.write(`![${node.attrs.alt || ''}](${node.attrs.src})`);
          }
        },
        parse: {
          setup() {
            // O markdown-it já lida com imagens padrão. 
            // Para imagens com width/layout, o fallback de HTML (html: true) deve resolver.
          }
        }
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNode);
  },
});

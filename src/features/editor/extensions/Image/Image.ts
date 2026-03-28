import Image from '@tiptap/extension-image';
import { ReactNodeViewRenderer } from '@tiptap/react';
import ImageNode from './ImageNode';

export const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
      height: {
        default: 'auto',
        renderHTML: attributes => ({
          height: attributes.height,
        }),
      },
      align: {
        default: 'center', // left, center, right
        renderHTML: attributes => ({
          'data-align': attributes.align,
        }),
      },
      float: {
        default: 'none', // left, right, none
        renderHTML: attributes => ({
          'data-float': attributes.float,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNode);
  },
});

import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import PostItNodeView from './PostItNodeView';

export interface PostItOptions {
  HTMLAttributes: Record<string, any>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    postIt: {
      /**
       * Insert a post-it
       */
      setPostIt: () => ReturnType;
    }
  }
}

export const PostIt = Node.create<PostItOptions>({
  name: 'postIt',

  group: 'block',

  content: 'inline*',

  defining: true,

  addAttributes() {
    return {
      backgroundColor: {
        default: '#fef3c7',
        parseHTML: element => element.getAttribute('data-background-color'),
        renderHTML: attributes => ({
          'data-background-color': attributes.backgroundColor,
          style: `background-color: ${attributes.backgroundColor}`,
        }),
      },
      color: {
        default: '#92400e',
        parseHTML: element => element.getAttribute('data-color'),
        renderHTML: attributes => ({
          'data-color': attributes.color,
          style: `color: ${attributes.color}`,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="post-it"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, { 'data-type': 'post-it' }), 0];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PostItNodeView);
  },

  addCommands() {
    return {
      setPostIt: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
          content: [{ type: 'text', text: 'Novo Post-it' }],
        });
      },
    };
  },
});

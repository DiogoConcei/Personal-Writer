import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import tippy, { Instance } from 'tippy.js';
import WikiLinkNode from './WikiLinkNode';
import WikiLinkList from './WikiLinkList';

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
  onLinkClick?: (noteName: string) => void;
  suggestion: any;
}

export const WikiLink = Node.create<WikiLinkOptions>({
  name: 'wikiLink',

  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => ({
          'data-label': attributes.label,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="wiki-link"]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-type': 'wiki-link' }, HTMLAttributes, { 'data-label': node.attrs.label }), `[[${node.attrs.label}]]` ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(WikiLinkNode);
  },

  addOptions() {
    return {
      HTMLAttributes: {},
      onLinkClick: undefined,
      suggestion: {
        char: '[[',
        // Removido pluginKey manual para evitar erro de getState
        command: ({ editor, range, props }: any) => {
          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: 'wikiLink',
                attrs: { label: props.id },
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run();
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: Instance | null = null;

          return {
            onStart: (props: any) => {
              component = new ReactRenderer(WikiLinkList, {
                props,
                editor: props.editor,
              });

              if (!props.clientRect) {
                return;
              }

              // @ts-ignore
              const tippyInstances = tippy('body', {
                getReferenceClientRect: props.clientRect,
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });

              popup = tippyInstances[0];
            },

            onUpdate(props: any) {
              component?.updateProps(props);

              if (!props.clientRect || !popup) {
                return;
              }

              popup.setProps({
                getReferenceClientRect: props.clientRect,
              });
            },

            onKeyDown(props: any) {
              if (props.event.key === 'Escape') {
                popup?.hide();
                return true;
              }

              return (component?.ref as any)?.onKeyDown(props);
            },

            onExit() {
              if (popup) {
                popup.destroy();
                popup = null;
              }
              if (component) {
                component.destroy();
                component = null;
              }
            },
          };
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

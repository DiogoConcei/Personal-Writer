import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer, ReactRenderer } from '@tiptap/react';
import Suggestion from '@tiptap/suggestion';
import { PluginKey } from '@tiptap/pm/state';
import tippy, { Instance } from 'tippy.js';
import WikiLinkNode from './WikiLinkNode';
import WikiLinkList from './WikiLinkList';

export interface WikiLinkOptions {
  HTMLAttributes: Record<string, any>;
  onLinkClick?: (noteName: string) => void;
  suggestion: any;
}

export const WikiLinkSuggestionKey = new PluginKey('wikiLinkSuggestion');

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
    return ['span', mergeAttributes({ 'data-type': 'wiki-link' }, HTMLAttributes, { 'data-label': node.attrs.label })];
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          state.write(`[[${node.attrs.label}]]`);
        },
        parse: {
          setup(markdownit: any) {
            // Regra para [[WikiLink]] original - Definida primeiro
            markdownit.inline.ruler.before('link', 'wiki_link', (state: any, silent: boolean) => {
              const start = state.pos;
              if (state.src.charCodeAt(start) !== 0x5B /* [ */ || state.src.charCodeAt(start + 1) !== 0x5B /* [ */) {
                return false;
              }

              const match = state.src.slice(start).match(/^\[\[([^\]]+)\]\]/);
              if (!match) return false;

              if (!silent) {
                const token = state.push('wiki_link_open', 'span', 1);
                token.attrs = [['data-label', match[1]], ['data-type', 'wiki-link']];
                
                const textToken = state.push('text', '', 0);
                textToken.content = match[1];
                
                state.push('wiki_link_close', 'span', -1);
              }

              state.pos += match[0].length;
              return true;
            });

            // Regra para ![[imagem.png]] (Embed de Imagem do Obsidian) - Inserida antes da wiki_link
            markdownit.inline.ruler.before('wiki_link', 'obsidian_image', (state: any, silent: boolean) => {
              const start = state.pos;
              if (
                state.src.charCodeAt(start) !== 0x21 /* ! */ ||
                state.src.charCodeAt(start + 1) !== 0x5B /* [ */ ||
                state.src.charCodeAt(start + 2) !== 0x5B /* [ */
              ) {
                return false;
              }

              const match = state.src.slice(start).match(/^!\[\[([^\]]+)\]\]/);
              if (!match) return false;

              if (!silent) {
                const token = state.push('image', 'img', 0);
                token.attrs = [
                  ['src', match[1]],
                  ['alt', match[1]],
                ];
                token.children = []; // Necessário para alguns renderers
                token.content = '';  // Resolve o erro de .length no renderInlineAsText
              }

              state.pos += match[0].length;
              return true;
            });
          },
        }
      }
    };
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
              if (popup && !popup.state.isDestroyed) {
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
        pluginKey: WikiLinkSuggestionKey,
        ...this.options.suggestion,
      }),
    ];
  },
});

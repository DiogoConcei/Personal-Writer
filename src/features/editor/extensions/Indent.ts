import { Extension } from '@tiptap/core';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    indent: {
      /**
       * Indent the current node
       */
      indent: () => ReturnType;
      /**
       * Outdent the current node
       */
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: 'indent',

  addOptions() {
    return {
      types: ['paragraph', 'heading', 'blockquote', 'codeBlock'],
      indentSize: 40,
      maxIndent: 8,
    };
  },

  addStorage() {
    return {
      markdown: {
        serialize(state: any, node: any) {
          if (node.attrs.indent) {
            state.write(' '.repeat(node.attrs.indent * 4));
          }
          state.renderContent(node);
        },
        parse: {
          setup(markdownit: any) {
            markdownit.block.ruler.before('paragraph', 'indentation', (state: any, startLine: any, endLine: any, silent: boolean) => {
              const line = state.getLines(startLine, startLine + 1, 0, false);
              const match = line.match(/^(\s+)/);
              
              if (match) {
                const indentStr = match[1];
                const spaces = indentStr.replace(/\t/g, '    ').length;
                const indentLevel = Math.min(Math.floor(spaces / 4), 8);
                
                if (indentLevel > 0) {
                  if (silent) return true;
                  
                  state.line = startLine;
                  const token = state.push('paragraph_open', 'p', 1);
                  token.attrs = [['indent', indentLevel]];
                  
                  state.md.block.tokenize(state, startLine, endLine);
                  
                  return true;
                }
              }
              return false;
            });
          }
        }
      }
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            keepOnSplit: false,
            parseHTML: element => parseInt(element.style.textIndent, 10) / this.options.indentSize || 0,
            renderHTML: attributes => {
              if (!attributes.indent) {
                return {};
              }

              return {
                style: `text-indent: ${attributes.indent * this.options.indentSize}px`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        const { from, to } = selection;

        state.doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const indent = (node.attrs.indent || 0) + 1;
            if (indent <= this.options.maxIndent) {
              tr = tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent,
              });
            }
            return false;
          }
        });

        if (dispatch) {
          dispatch(tr);
        }

        return true;
      },
      outdent: () => ({ tr, state, dispatch }) => {
        const { selection } = state;
        tr = tr.setSelection(selection);
        const { from, to } = selection;

        state.doc.nodesBetween(from, to, (node, pos) => {
          if (this.options.types.includes(node.type.name)) {
            const indent = (node.attrs.indent || 0) - 1;
            if (indent >= 0) {
              tr = tr.setNodeMarkup(pos, undefined, {
                ...node.attrs,
                indent,
              });
            }
            return false;
          }
        });

        if (dispatch) {
          dispatch(tr);
        }

        return true;
      },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => this.editor.commands.indent(),
      'Shift-Tab': () => this.editor.commands.outdent(),
      Backspace: () => {
        const { selection } = this.editor.state;
        const { empty, $anchor } = selection;

        if (!empty || $anchor.parentOffset !== 0) {
          return false;
        }

        const { indent } = $anchor.parent.attrs;

        if (indent > 0) {
          return this.editor.commands.outdent();
        }

        return false;
      },
    };
  },
});

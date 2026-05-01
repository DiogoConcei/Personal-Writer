import React, { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import {
  Heading1, Heading2, Heading3, Image, FileText,
  LayoutTemplate, List, ListOrdered, Quote, Code
} from 'lucide-react';
import styles from './SlashMenu.module.scss';
import { CommandItem } from '@/shared/types';
import { useUIStore } from '@/store/uiStore';

export const SlashMenu = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const items: CommandItem[] = [
    {
      title: 'Título 1',
      icon: <Heading1 size={20} />,
      color: '#e74c3c',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 1 }).run();
      },
    },
    {
      title: 'Título 2',
      icon: <Heading2 size={20} />,
      color: '#e67e22',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 2 }).run();
      },
    },
    {
      title: 'Título 3',
      icon: <Heading3 size={20} />,
      color: '#f1c40f',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).setNode('heading', { level: 3 }).run();
      },
    },
    {
      title: 'Lista',
      icon: <List size={20} />,
      color: '#2ecc71',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBulletList().run();
      },
    },
    {
      title: 'Lista Numerada',
      icon: <ListOrdered size={20} />,
      color: '#27ae60',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleOrderedList().run();
      },
    },
    {
      title: 'Citação',
      icon: <Quote size={20} />,
      color: '#3498db',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleBlockquote().run();
      },
    },
    {
      title: 'Código',
      icon: <Code size={20} />,
      color: '#9b59b6',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
      },
    },
    {
      title: 'Imagem',
      icon: <Image size={20} />,
      color: '#1abc9c',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        useUIStore.getState().setEditorModal('showGallery', true);
      },
    },
    {
      title: 'Modelo',
      icon: <LayoutTemplate size={20} />,
      color: '#ff79c6',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        useUIStore.getState().setEditorModal('showTemplates', true);
      },
    },
    {
      title: 'Anexar PDF',
      icon: <FileText size={20} />,
      color: '#8be9fd',
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).run();
        useUIStore.getState().setEditorModal('showDocuments', true);
      },
    },
  ];

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      item.command({ editor: props.editor, range: props.range });
    }
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: { event: KeyboardEvent }) => {
      if (event.key === 'ArrowLeft') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowRight') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }

      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + items.length - 1) % items.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % items.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  return (
    <div className={styles.slashMenu}>
      {items.map((item, index) => (
        <button
          key={index}
          className={`${styles.slashMenu__item} ${index === selectedIndex ? styles['slashMenu__item--active'] : ''}`}
          onClick={() => selectItem(index)}
          title={item.title}
          style={{ '--item-color': item.color } as React.CSSProperties}
        >
          <div className={styles.slashMenu__icon}>{item.icon}</div>
        </button>
      ))}
    </div>
  );
});

SlashMenu.displayName = 'SlashMenu';

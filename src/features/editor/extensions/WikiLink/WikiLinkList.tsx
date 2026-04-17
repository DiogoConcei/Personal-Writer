import { forwardRef, useImperativeHandle, useState } from 'react';
import styles from './WikiLinkList.module.scss';
import { useWorkspaceStore } from '@/features/workspace/store/workspaceStore';

const WikiLinkList = forwardRef((props: any, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { files } = useWorkspaceStore();

  const getFilesRecursive = (nodeList: any[]): any[] => {
    let result: any[] = [];
    nodeList.forEach(node => {
      if (node.is_dir) {
        result = [...result, ...getFilesRecursive(node.children || [])];
      } else if (node.name.endsWith('.md')) {
        result.push({
          id: node.name.replace(/\.md$/, ''),
          name: node.name.replace(/\.md$/, ''),
          path: node.path
        });
      }
    });
    return result;
  };

  const allNotes = getFilesRecursive(files);
  const filteredNotes = allNotes
    .filter(note => note.name.toLowerCase().includes(props.query.toLowerCase()))
    .slice(0, 10);

  const selectItem = (index: number) => {
    const item = filteredNotes[index];
    if (item) {
      props.command({ id: item.id });
    } else {

      props.command({ id: props.query });
    }
  };

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }: any) => {
      if (event.key === 'ArrowUp') {
        setSelectedIndex((selectedIndex + filteredNotes.length - 1) % filteredNotes.length);
        return true;
      }
      if (event.key === 'ArrowDown') {
        setSelectedIndex((selectedIndex + 1) % filteredNotes.length);
        return true;
      }
      if (event.key === 'Enter') {
        selectItem(selectedIndex);
        return true;
      }
      return false;
    },
  }));

  if (filteredNotes.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.item__empty}>Criar nota: [[{props.query}]]</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {filteredNotes.map((item, index) => (
        <button
          className={`${styles.item} ${index === selectedIndex ? styles['item--selected'] : ''}`}
          key={item.id}
          onClick={() => selectItem(index)}
        >
          {item.name}
        </button>
      ))}
    </div>
  );
});

WikiLinkList.displayName = 'WikiLinkList';

export default WikiLinkList;

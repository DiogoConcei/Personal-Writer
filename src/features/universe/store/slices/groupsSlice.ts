import { StateCreator } from 'zustand';
import { MesaTrabalhoState } from '@/shared/types';
import { MesaGrupo } from '@/shared/types';
import { calculateAveragePosition, getMaxZIndex, consolidateExtraPaths } from '../utils/mesaUtils';

export const createGroupsSlice: StateCreator<MesaTrabalhoState, [], [], Partial<MesaTrabalhoState>> = (set, get) => ({
  groups: [],

  updateGroup: (id, updates) => set((state) => ({
    groups: state.groups.map(g => g.id === id ? { ...g, ...updates } : g)
  })),

  removeGroup: (id) => set((state) => ({
    groups: state.groups.filter(g => g.id !== id),
    items: state.items.map(item => item.groupId === id ? { ...item, groupId: undefined } : item)
  })),

  groupSelectedItems: () => {
    const { selectedItems, items, groups, boardMode, takeSnapshot } = get();
    if (selectedItems.length < 2) return null;

    takeSnapshot();
    const itemsToGroup = items.filter(i => selectedItems.includes(i.id));
    
    // MODO PLANEJAMENTO: Fundir em uma única entidade (Galeria)
    if (boardMode === 'planning') {
      const [primaryItem, ...otherItems] = itemsToGroup;
      const uniqueExtraPaths = consolidateExtraPaths(primaryItem, otherItems);

      set(state => ({
        items: state.items
          .filter(i => !selectedItems.includes(i.id) || i.id === primaryItem.id)
          .map(i => i.id === primaryItem.id ? { ...i, extraPaths: uniqueExtraPaths } : i),
        selectedItems: []
      }));

      return primaryItem.id;
    }

    // MODO LIVRE: Comportamento padrão de layout em linha
    const { x, y } = calculateAveragePosition(itemsToGroup);
    const maxZ = getMaxZIndex(items, groups);

    const groupId = crypto.randomUUID();
    const newGroup: MesaGrupo = {
      id: groupId,
      x,
      y,
      zIndex: maxZ + 1,
      title: 'Novo Grupo'
    };

    set(state => ({
      groups: [...state.groups, newGroup],
      items: state.items.map(item => {
        if (selectedItems.includes(item.id)) {
          const index = selectedItems.indexOf(item.id);
          return { 
            ...item, 
            groupId, 
            groupOrder: index,
            rotation: 0,
            scale: item.scale > 1.2 ? 1.2 : item.scale
          };
        }
        return item;
      }),
      selectedItems: []
    }));

    return groupId;
  },

  ungroupItems: (groupId) => {
    get().takeSnapshot();
    set(state => {
      const group = state.groups.find(g => g.id === groupId);
      if (!group) return state;

      return {
        groups: state.groups.filter(g => g.id !== groupId),
        items: state.items.map(item => {
          if (item.groupId === groupId) {
            return { 
              ...item, 
              groupId: undefined, 
              groupOrder: undefined,
              x: group.x + (item.groupOrder || 0) * 80, // Espaçamento maior ao desagrupar
              y: group.y
            };
          }
          return item;
        })
      };
    });
  },

  reorderInGroup: (groupId, itemId, direction) => set(state => {
    const groupItems = state.items
      .filter(i => i.groupId === groupId)
      .sort((a, b) => (a.groupOrder || 0) - (b.groupOrder || 0));
    
    const index = groupItems.findIndex(i => i.id === itemId);
    if (index === -1) return state;

    const newIndex = direction === 'left' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= groupItems.length) return state;

    const newItems = [...groupItems];
    [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];

    return {
      items: state.items.map(item => {
        const foundIndex = newItems.findIndex(ni => ni.id === item.id);
        if (foundIndex !== -1) {
          return { ...item, groupOrder: foundIndex };
        }
        return item;
      })
    };
  }),

  mergeIntoGroup: (sourceId, targetId) => {
    get().takeSnapshot();
    set(state => {
      const source = state.items.find(i => i.id === sourceId);
      const target = state.items.find(i => i.id === targetId);
      if (!source || !target || sourceId === targetId) return state;

      // Se já estão no mesmo grupo, ignorar
      if (source.groupId && source.groupId === target.groupId) return state;

      let targetGroupId = target.groupId;
      let updatedGroups = [...state.groups];

      if (!targetGroupId) {
        // Se o target não tem grupo mas o source tem, adicionar target ao grupo do source
        if (source.groupId) {
          targetGroupId = source.groupId;
        } else {
          // Criar novo grupo se nenhum tiver
          targetGroupId = crypto.randomUUID();
          const maxZ = getMaxZIndex(state.items, state.groups);
          updatedGroups.push({
            id: targetGroupId,
            x: target.x,
            y: target.y,
            zIndex: maxZ + 1,
            title: 'Novo Grupo'
          });
        }
      }

      return {
        groups: updatedGroups,
        items: state.items.map(item => {
          if (item.id === sourceId || item.id === targetId) {
            // Contar itens já no grupo para definir a ordem
            const itemsInGroupCount = state.items.filter(i => i.groupId === targetGroupId).length;
            
            return {
              ...item,
              groupId: targetGroupId,
              groupOrder: item.id === sourceId ? itemsInGroupCount : (target.groupId ? target.groupOrder : 0),
              rotation: 0,
              scale: item.scale > 1.2 ? 1.2 : item.scale
            };
          }
          return item;
        })
      };
    });
  },
});

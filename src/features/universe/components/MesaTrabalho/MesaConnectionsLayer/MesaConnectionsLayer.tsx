import { useMesaTrabalhoStore } from '../../../store/moodBoardStore';
import styles from '../MesaTrabalho/MesaTrabalho.module.scss';

export function MesaConnectionsLayer() {
  const { connections, items } = useMesaTrabalhoStore();

  if (connections.length === 0) return null;

  return (
    <svg className={styles.connectionsLayer}>
      <defs>
        <filter id="stringShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="1" />
          <feOffset dx="1" dy="1" result="offsetblur" />
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {connections.map((conn) => {
        const fromItem = items.find(i => i.id === conn.from);
        const toItem = items.find(i => i.id === conn.to);

        if (!fromItem || !toItem) return null;

        // Calcular centros (aproximados, assumindo larguras padrão se não houver)
        const x1 = fromItem.x + 40; // Ajuste baseado no tamanho médio dos itens
        const y1 = fromItem.y + 40;
        const x2 = toItem.x + 40;
        const y2 = toItem.y + 40;

        // Curvatura leve para parecer um fio real
        const midX = (x1 + x2) / 2;
        const midY = (y1 + y2) / 2 - 20;

        return (
          <g key={conn.id} className={styles.connectionGroup}>
            <path
              d={`M ${x1} ${y1} Q ${midX} ${midY} ${x2} ${y2}`}
              stroke={conn.color || '#ef4444'}
              strokeWidth="2"
              fill="none"
              filter="url(#stringShadow)"
              className={styles.stringPath}
            />
          </g>
        );
      })}
    </svg>
  );
}

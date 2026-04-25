import React, { useState, useRef, useEffect } from 'react';
import styles from './InfiniteCanvas.module.scss';

export default function InfiniteCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewState, setViewState] = useState({
    x: 0,
    y: 0,
    zoom: 1,
  });

  // Futura implementação de Pan e Zoom para o canvas infinito
  // Por enquanto apenas uma tela vazia Gunmetal

  return (
    <div className={styles.container}>
      <div className={styles.canvas} ref={containerRef}>
        <div className={styles.grid} />
        {/* Futuros componentes virtualizados serão renderizados aqui */}
      </div>
    </div>
  );
}

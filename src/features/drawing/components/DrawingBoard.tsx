import React, { Suspense, useEffect, useState } from 'react';
import styles from './DrawingBoard.module.scss';

// CSS essencial para o Excalidraw funcionar (sem ele o layout quebra totalmente)
import "@excalidraw/excalidraw/index.css";

// Carrega o Excalidraw dinamicamente (Lazy Load)
const Excalidraw = React.lazy(() => import('@excalidraw/excalidraw').then(module => ({ default: module.Excalidraw })));

export default function DrawingBoard() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return <div className={styles.loading}>Carregando ambiente de desenho...</div>;

  return (
    <div className={styles.boardContainer}>
      <Suspense fallback={<div className={styles.loading}>Carregando Excalidraw...</div>}>
        <Excalidraw theme="dark" />
      </Suspense>
    </div>
  );
}

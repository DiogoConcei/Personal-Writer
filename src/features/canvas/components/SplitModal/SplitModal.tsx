import React, { useState, useEffect } from 'react';
import styles from './SplitModal.module.scss';
import { Minus, Plus, X } from 'lucide-react';
import { SplitMode, SplitModalProps } from '@/shared/types';

export const SplitModal: React.FC<SplitModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  totalItems,
  itemName,
  initialPage = 1
}) => {
  const [mode, setMode] = useState<SplitMode>('single');
  const [amount, setAmount] = useState(1);
  const [startPage, setStartPage] = useState(initialPage);
  const [endPage, setEndPage] = useState(Math.min(initialPage + 1, totalItems));
  const [singlePage, setSinglePage] = useState(initialPage);

  useEffect(() => {
    if (isOpen) {
      setSinglePage(initialPage);
      setStartPage(initialPage);
      setEndPage(Math.min(initialPage + 1, totalItems));
    }
  }, [isOpen, initialPage, totalItems]);

  if (!isOpen) return null;

  const handleManualInput = (val: string, setter: (n: number) => void, max: number) => {
    const num = parseInt(val.replace(/\D/g, ''), 10);
    if (!isNaN(num)) setter(Math.min(num, max));
    else setter(1);
  };

  return (
    <div className={styles.panelWrapper}>
      <div className={styles.panel}>
        <button className={styles.closeBtn} onClick={onClose} title="Fechar">
          <X size={12} />
        </button>

        <header className={styles.header}>
          <h3>Extração de partes</h3>
          <span className={styles.totalPages}>{totalItems} PÁGS</span>
        </header>

        <nav className={styles.tabs}>
          <button className={mode === 'amount' ? styles.active : ''} onClick={() => setMode('amount')}>Qtd</button>
          <button className={mode === 'single' ? styles.active : ''} onClick={() => setMode('single')}>Pág</button>
          <button className={mode === 'range' ? styles.active : ''} onClick={() => setMode('range')}>Range</button>
        </nav>

        <div className={styles.modeContainer}>
          {mode === 'amount' && (
            <div className={styles.customInput}>
              <div className={styles.controlGroup}>
                <button className={styles.navBtn} onClick={() => setAmount(Math.max(1, amount - 1))}><Minus size={12}/></button>
                <input 
                  type="text" 
                  className={styles.numberDisplay} 
                  value={amount.toString().padStart(2, '0')}
                  onChange={(e) => handleManualInput(e.target.value, setAmount, totalItems - 1)}
                />
                <button className={styles.navBtn} onClick={() => setAmount(Math.min(totalItems - 1, amount + 1))}><Plus size={12}/></button>
              </div>
              <input type="range" className={styles.slider} min={1} max={totalItems - 1} value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              <div className={styles.secondaryOptions}>
                <div className={styles.option}>
                  <label>Início</label>
                  <input type="number" value={startPage} onChange={(e) => setStartPage(Number(e.target.value))} min={1} max={totalItems} />
                </div>
              </div>
            </div>
          )}

          {mode === 'single' && (
            <div className={styles.customInput}>
              <div className={styles.controlGroup}>
                <button className={styles.navBtn} onClick={() => setSinglePage(Math.max(1, singlePage - 1))}><Minus size={12}/></button>
                <input 
                  type="text" 
                  className={styles.numberDisplay} 
                  value={singlePage.toString().padStart(2, '0')}
                  onChange={(e) => handleManualInput(e.target.value, setSinglePage, totalItems)}
                />
                <button className={styles.navBtn} onClick={() => setSinglePage(Math.min(totalItems, singlePage + 1))}><Plus size={12}/></button>
              </div>
              <input type="range" className={styles.slider} min={1} max={totalItems} value={singlePage} onChange={(e) => setSinglePage(Number(e.target.value))} />
            </div>
          )}

          {mode === 'range' && (
            <div className={styles.customInput}>
              <div className={styles.controlGroup}>
                <div className={styles.rangeDisplay}>
                  <input 
                    type="text" 
                    value={startPage.toString().padStart(2, '0')} 
                    onChange={(e) => handleManualInput(e.target.value, setStartPage, endPage - 1)}
                  />
                  <span>&mdash;</span>
                  <input 
                    type="text" 
                    value={endPage.toString().padStart(2, '0')} 
                    onChange={(e) => handleManualInput(e.target.value, setEndPage, totalItems)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.actions}>
          <button className={styles.confirm} onClick={() => onConfirm({ mode, amount, startPage, endPage, singlePage })}>
            {mode === 'single' ? 'Extrair Parte' : 'Extrair Partes'}
          </button>
        </div>
      </div>
    </div>
  );
};

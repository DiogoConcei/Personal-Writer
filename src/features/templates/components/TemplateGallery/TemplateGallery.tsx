import React from 'react';
import { User, MapPin, FileText, X } from 'lucide-react';
import styles from './TemplateGallery.module.scss';
import { DEFAULT_TEMPLATES } from '../../data/defaultTemplates';
import { TemplateGalleryProps, Template } from '@/shared/types';

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({ onSelect, onClose }) => {
  const getIcon = (id: string) => {
    switch (id) {
      case 'character': return <User size={32} />;
      case 'location': return <MapPin size={32} />;
      default: return <FileText size={32} />;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Escolha um Modelo</h2>
          <button className={styles.closeBtn} onClick={onClose}><X size={20} /></button>
        </div>
        
        <div className={styles.grid}>
          {DEFAULT_TEMPLATES.map((template: Template) => (
            <button 
              key={template.id} 
              className={styles.card}
              onClick={() => onSelect(template.content)}
            >
              <div className={styles.card__icon}>{getIcon(template.id)}</div>
              <div className={styles.card__content}>
                <h3>{template.name}</h3>
                <p>Estrutura pronta para {template.name.toLowerCase()}.</p>
              </div>
            </button>
          ))}
          
          <button 
            className={`${styles.card} ${styles['card--empty']}`}
            onClick={() => onSelect('')}
          >
            <div className={styles.card__icon}><FileText size={32} /></div>
            <div className={styles.card__content}>
              <h3>Nota Vazia</h3>
              <p>Começar do zero, sem metadados.</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

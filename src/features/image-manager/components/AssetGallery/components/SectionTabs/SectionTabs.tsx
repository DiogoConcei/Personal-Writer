import React from 'react';
import { GallerySection } from '@/shared/types';
import { Image, Layers, Sparkles } from 'lucide-react';
import styles from './SectionTabs.module.scss';

interface SectionTabsProps {
  activeSection: GallerySection;
  onSectionChange: (section: GallerySection) => void;
}

export const SectionTabs: React.FC<SectionTabsProps> = ({ activeSection, onSectionChange }) => {
  const sections = [
    { id: 'geral' as GallerySection, label: 'Geral', icon: <Image size={16} /> },
    { id: 'collages' as GallerySection, label: 'Colagens', icon: <Layers size={16} /> },
    { id: 'editions' as GallerySection, label: 'Edições', icon: <Sparkles size={16} /> },
  ];

  return (
    <div className={styles.tabs}>
      {sections.map((section) => (
        <button
          key={section.id}
          className={`${styles.tab} ${activeSection === section.id ? styles['tab--active'] : ''}`}
          onClick={() => onSectionChange(section.id)}
        >
          {section.icon}
          <span>{section.label}</span>
          {activeSection === section.id && <div className={styles.indicator} />}
        </button>
      ))}
    </div>
  );
};

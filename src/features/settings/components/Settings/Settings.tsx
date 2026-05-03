import React, { useState } from 'react';
import styles from './Settings.module.scss';
import { Type, Puzzle } from 'lucide-react';
import { EditorSettings } from '../EditorSettings/EditorSettings';
import { PluginManager } from '../PluginManager/PluginManager';

type TabId = 'editor' | 'plugins';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('editor');

  const tabs = [
    { id: 'editor' as TabId, label: 'Editor de Notas', icon: <Type size={18} /> },
    { id: 'plugins' as TabId, label: 'Gerenciar Plugins', icon: <Puzzle size={18} /> },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'editor':
        return <EditorSettings />;
      case 'plugins':
        return <PluginManager />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.settingsContainer}>
      <aside className={styles.sidebar}>
        <h1>Ajustes</h1>
        <nav className={styles.nav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.navItem} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className={styles.content}>
        {renderContent()}
      </main>
    </div>
  );
};

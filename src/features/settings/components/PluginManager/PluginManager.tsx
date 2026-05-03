import React from 'react';
import { usePluginStore } from '../../store/pluginStore';
import { PluginMetadata } from '@/shared/types';
import styles from './PluginManager.module.scss';
import { 
  Download, 
  Trash2, 
  Power, 
  Info, 
  CheckCircle2, 
  Cpu, 
  Globe,
  Puzzle,
  RefreshCw
} from 'lucide-react';

export const PluginManager: React.FC = () => {
  const { plugins, installPlugin, uninstallPlugin, togglePlugin, resetPlugins } = usePluginStore();

  const handleInstall = async (id: string) => {
    // Aqui no futuro poderia ter um loading visual
    await installPlugin(id);
  };

  const renderPluginCard = (plugin: PluginMetadata) => {
    const isInstalled = plugin.status !== 'not-installed';
    const isEnabled = plugin.status === 'enabled';

    return (
      <div 
        key={plugin.id} 
        className={`${styles.pluginCard} ${isEnabled ? styles.enabled : ''}`}
      >
        <div className={styles.pluginInfo}>
          <div className={styles.header}>
            <h3>{plugin.title}</h3>
            <span className={styles.badge}>v{plugin.version}</span>
          </div>
          <p className={styles.description}>{plugin.description}</p>
          
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span className={styles.statusIndicator}>
              {plugin.category === 'Writer' && <Globe size={12} />}
              {plugin.category === 'Planning' && <Cpu size={12} />}
              {plugin.category === 'Design' && <Puzzle size={12} />}
              {plugin.category}
            </span>
          </div>
        </div>

        <div className={styles.pluginFooter}>
          <div className={styles.actions}>
            {!isInstalled ? (
              <button 
                className={styles.install} 
                onClick={() => handleInstall(plugin.id)}
              >
                <Download size={16} /> Instalar
              </button>
            ) : (
              <>
                <button 
                  className={`${styles.toggle} ${isEnabled ? styles.on : ''}`}
                  onClick={() => togglePlugin(plugin.id)}
                >
                  <Power size={16} /> {isEnabled ? 'Desativar' : 'Ativar'}
                </button>
                <button 
                  className={styles.uninstall}
                  onClick={() => uninstallPlugin(plugin.id)}
                  title="Desinstalar (Remove arquivos do disco)"
                >
                  <Trash2 size={16} />
                </button>
              </>
            )}
          </div>
        </div>

        {isEnabled && (
          <div style={{ position: 'absolute', top: 10, right: 10, color: 'var(--color-success)' }}>
            <CheckCircle2 size={14} />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={styles.container}>
      <header className={styles.headerMain}>
        <div className={styles.headerInfo}>
          <h1>Plugin Manager</h1>
          <p>
            Personalize sua experiência adicionando funcionalidades modulares. 
            Plugins instalados podem consumir recursos de memória e CPU.
          </p>
        </div>
        <button 
          className={styles.syncBtn} 
          onClick={resetPlugins}
          title="Sincronizar Plugins com a Definição do Sistema (Reset)"
        >
          <RefreshCw size={18} />
          Sincronizar
        </button>
      </header>

      <section className={styles.pluginGrid}>
        {plugins.map(renderPluginCard)}
      </section>

      {plugins.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-muted)' }}>
          <Info size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>Nenhum plugin disponível no momento.</p>
        </div>
      )}
    </div>
  );
};

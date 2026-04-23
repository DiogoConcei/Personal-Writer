import React from 'react';
import { useUIStore } from '@/store/uiStore';
import { Settings, Puzzle } from 'lucide-react';

interface PluginPlaceholderProps {
  name: string;
  id: string;
}

export const PluginPlaceholder: React.FC<PluginPlaceholderProps> = ({ name }) => {
  const { setActivePanel } = useUIStore();

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '40px',
      textAlign: 'center',
      background: 'var(--color-bg-base)',
      color: 'var(--color-text-primary)'
    }}>
      <div style={{
        background: 'var(--color-bg-surface)',
        padding: '32px',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--color-border)',
        maxWidth: '400px',
        boxShadow: 'var(--shadow-lg)'
      }}>
        <Puzzle size={48} style={{ marginBottom: '16px', color: 'var(--color-accent)' }} />
        <h2 style={{ marginBottom: '8px' }}>Funcionalidade Modular</h2>
        <p style={{ color: 'var(--color-text-secondary)', marginBottom: '24px', fontSize: 'var(--font-size-sm)' }}>
          A ferramenta <strong>{name}</strong> é um plugin opcional e não está ativada no momento. 
          Ative-a no Gerenciador de Plugins para começar a usar.
        </p>
        <button 
          onClick={() => setActivePanel('settings')}
          style={{
            background: 'var(--color-accent)',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            margin: '0 auto',
            fontWeight: 500
          }}
        >
          <Settings size={18} /> Ir para Plugin Manager
        </button>
      </div>
    </div>
  );
};

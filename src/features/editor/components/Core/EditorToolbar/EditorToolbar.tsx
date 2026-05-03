import { ReactNode, useRef, useEffect } from "react";
import { LucideIcon } from "lucide-react";
import styles from "./EditorToolbar.module.scss";

interface EditorToolbarProps {
  children: ReactNode;
}

/**
 * Componente principal da Toolbar utilizando o padrão de composição.
 */
export function EditorToolbar({ children }: EditorToolbarProps) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.toolbar__actions}>
        {children}
      </div>
    </div>
  );
}

interface ActionProps {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  badge?: number;
}

/**
 * Botão de ação genérico para a Toolbar.
 */
function Action({ icon: Icon, label, onClick, badge }: ActionProps) {
  return (
    <button className={styles.button} onClick={onClick}>
      <Icon size={14} /> {label}
      {badge !== undefined && badge > 0 && (
        <span className={styles.badge}>{badge}</span>
      )}
    </button>
  );
}

interface DropdownProps {
  icon: LucideIcon;
  label: string;
  isOpen: boolean;
  onToggle: (isOpen: boolean) => void;
  children: ReactNode;
}

/**
 * Container para dropdowns na Toolbar.
 */
function Dropdown({ icon: Icon, label, isOpen, onToggle, children }: DropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onToggle(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button className={styles.button} onClick={() => onToggle(!isOpen)}>
        <Icon size={14} /> {label}
      </button>
      {isOpen && <div className={styles.menu}>{children}</div>}
    </div>
  );
}

interface DropdownItemProps {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

/**
 * Item individual dentro de um Dropdown.
 */
function DropdownItem({ label, onClick, icon: Icon }: DropdownItemProps) {
  return (
    <button className={styles.menu__item} onClick={onClick}>
      {Icon && <Icon size={14} />}
      {label}
    </button>
  );
}

// Vinculando sub-componentes ao componente pai para facilitar o uso via composição
EditorToolbar.Action = Action;
EditorToolbar.Dropdown = Dropdown;
EditorToolbar.DropdownItem = DropdownItem;

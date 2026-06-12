/**
 * Interface para templates de notas.
 */
export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

export interface TemplateGalleryProps {
  onSelect: (content: string) => void;
  onClose: () => void;
}

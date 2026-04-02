import { useEditorStore } from '@/features/editor/store/editorStore';
import { CharacterHeader } from './CharacterHeader';
import { LocationHeader } from './LocationHeader';
import { DefaultHeader } from './DefaultHeader';

export function MetadataHeader() {
  const { metadata } = useEditorStore();

  if (!metadata.type && !metadata.fields) return null;

  if (metadata.type === 'character') {
    return <CharacterHeader />;
  }

  if (metadata.type === 'location') {
    return <LocationHeader />;
  }

  return <DefaultHeader />;
}

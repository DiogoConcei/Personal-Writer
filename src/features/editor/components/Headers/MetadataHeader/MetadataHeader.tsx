import { useEditorStore } from '@/features/editor/store/editorStore';
import { CharacterHeader } from '../CharacterHeader/CharacterHeader';
import { LocationHeader } from '../LocationHeader/LocationHeader';

import { MetadataHeaderProps } from '@/shared/types';

export function MetadataHeader({ metadata: propMetadata, readOnly }: MetadataHeaderProps) {
  const { metadata: storeMetadata } = useEditorStore();
  const metadata = propMetadata || storeMetadata;

  if (!metadata.type && !metadata.fields) return null;

  if (metadata.type === 'character') {
    return <CharacterHeader metadata={propMetadata} readOnly={readOnly} />;
  }

  if (metadata.type === 'location') {
    return <LocationHeader metadata={propMetadata} readOnly={readOnly} />;
  }

  return null;
}

import { useEditorStore } from '@/features/editor/store/editorStore';
import { Metadata } from '@/features/editor/store/metadataParser';
import { CharacterHeader } from './CharacterHeader';
import { LocationHeader } from './LocationHeader';

interface MetadataHeaderProps {
  metadata?: Metadata;
  readOnly?: boolean;
}

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

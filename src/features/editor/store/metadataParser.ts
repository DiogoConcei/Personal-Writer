import { EditorMetadata } from '@/shared/types';

export const parseMarkdownMetadata = (content: string) => {
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)(?:\r?\n)?---(?:\r?\n|$)/);
  if (!yamlMatch) return { metadata: {} as EditorMetadata, markdown: content };

  const yamlStr = yamlMatch[1];
  const markdown = content.replace(yamlMatch[0], '').trim();
  const data: EditorMetadata = { fields: {} };

  const typeMatch = yamlStr.match(/type:\s*["']?([^"'\r\n]+)["']?/i);
  const iconMatch = yamlStr.match(/icon:\s*["']?([^"'\r\n]+)["']?/i);
  const musicMatch = yamlStr.match(/music:\s*["']?([^"'\r\n]+)["']?/i);
  const configMatch = yamlStr.match(/config:\s*'(.*?)'/i);
  const wordGoalMatch = yamlStr.match(/wordGoal:\s*(\d+)/i);
  const sessionGoalMatch = yamlStr.match(/sessionGoal:\s*(\d+)/i);

  const imagesMatch = yamlStr.match(/images:\s*\[(.*?)\]/i);
  const docsMatch = yamlStr.match(/documents:\s*\[(.*?)\]/i);
  const linkedMatch = yamlStr.match(/linked_characters:\s*\[(.*?)\]/i);

  if (typeMatch) data.type = typeMatch[1].trim();
  if (iconMatch) data.icon = iconMatch[1].trim();
  if (musicMatch) data.music = musicMatch[1].trim();
  if (wordGoalMatch) data.wordGoal = Number(wordGoalMatch[1]);
  if (sessionGoalMatch) data.sessionGoal = Number(sessionGoalMatch[1]);
  
  if (imagesMatch) {
    data.images = imagesMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
  } else {
    data.images = [];
  }

  if (docsMatch) {
    data.documents = docsMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
  } else {
    data.documents = [];
  }

  if (linkedMatch) {
    data.linked_characters = linkedMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
  } else {
    data.linked_characters = [];
  }

  if (configMatch) {
    try {
      data.config = JSON.parse(configMatch[1]);
    } catch (e) {}
  }

  const fieldsBlock = yamlStr.match(/fields:\r?\n([\s\S]*?)(?=\r?\n[a-z]|$)/i);
  if (fieldsBlock) {
    const lines = fieldsBlock[1].split('\n');
    lines.forEach(line => {
      const parts = line.split(':');
      if (parts.length >= 2) {
        const k = parts[0].trim();
        const v = parts.slice(1).join(':').trim().replace(/["']/g, '');
        if (k) data.fields![k] = isNaN(Number(v)) ? v : Number(v);
      }
    });
  }
  return { metadata: data, markdown };
};

export const stringifyYAML = (metadata: EditorMetadata) => {
  if (!metadata || Object.keys(metadata).length === 0) return '';

  const normalize = (path: string) => path.replace(/\\/g, '/');

  let yaml = '';
  if (metadata.type) yaml += `type: ${metadata.type}\n`;
  if (metadata.icon) yaml += `icon: "${normalize(metadata.icon)}"\n`;
  if (metadata.music !== undefined) yaml += `music: "${normalize(metadata.music)}"\n`;
  if (metadata.wordGoal !== undefined) yaml += `wordGoal: ${metadata.wordGoal}\n`;
  if (metadata.sessionGoal !== undefined) yaml += `sessionGoal: ${metadata.sessionGoal}\n`;
  
  if (metadata.images && metadata.images.length > 0) {
    yaml += `images: [${metadata.images.map(i => `"${normalize(i)}"`).join(', ')}]\n`;
  }
  if (metadata.documents && metadata.documents.length > 0) {
    yaml += `documents: [${metadata.documents.map(d => `"${normalize(d)}"`).join(', ')}]\n`;
  }
  if (metadata.linked_characters && metadata.linked_characters.length > 0) {
    yaml += `linked_characters: [${metadata.linked_characters.map(c => `"${c}"`).join(', ')}]\n`;
  }
  if (metadata.config && Object.keys(metadata.config).length > 0) {
    yaml += `config: '${JSON.stringify(metadata.config)}'\n`;
  }
  if (metadata.fields && Object.keys(metadata.fields).length > 0) {
    yaml += `fields:\n`;
    Object.entries(metadata.fields).forEach(([k, v]) => {
      const formattedValue = typeof v === 'string' ? `"${v}"` : v;
      yaml += `  ${k}: ${formattedValue}\n`;
    });
  }
  
  if (!yaml) return '';
  return `---\n${yaml}---`;
};

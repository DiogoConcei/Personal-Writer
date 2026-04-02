export interface FieldConfig {
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface Metadata {
  type?: string;
  icon?: string;
  images?: string[];
  music?: string;
  linked_characters?: string[];
  config?: Record<string, FieldConfig>;
  fields?: Record<string, any>;
}

export const parseMarkdownMetadata = (content: string) => {
  const yamlMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!yamlMatch) return { metadata: {}, markdown: content };

  const yamlStr = yamlMatch[1];
  const markdown = content.replace(yamlMatch[0], '').trim();
  const data: Metadata = { fields: {} };

  const typeMatch = yamlStr.match(/type:\s*["']?([^"'\r\n]+)["']?/i);
  const iconMatch = yamlStr.match(/icon:\s*["']?([^"'\r\n]+)["']?/i);
  const musicMatch = yamlStr.match(/music:\s*["']?([^"'\r\n]+)["']?/i);
  const configMatch = yamlStr.match(/config:\s*'(.*?)'/i);

  const imagesMatch = yamlStr.match(/images:\s*\[(.*?)\]/i);
  const linkedMatch = yamlStr.match(/linked_characters:\s*\[(.*?)\]/i);

  if (typeMatch) data.type = typeMatch[1].trim();
  if (iconMatch) data.icon = iconMatch[1].trim();
  if (musicMatch) data.music = musicMatch[1].trim();
  
  if (imagesMatch) {
    data.images = imagesMatch[1].split(',').map(s => s.trim().replace(/["']/g, '')).filter(Boolean);
  } else {
    data.images = [];
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

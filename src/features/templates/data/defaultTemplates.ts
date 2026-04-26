import { Template } from '@/shared/types';

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'empty',
    name: 'Nota Vazia',
    description: 'Comece do zero',
    content: ''
  },
  {
    id: 'character',
    name: 'Personagem',
    description: 'Ficha de personagem com ícone e atributos',
    content: `---
type: character
icon: ""
fields:
  Classe: ""
  Raça: ""
  Nível: 1
  Status: "Vivo"
---

# Novo Personagem

Escreva a história e detalhes aqui...`
  },
  {
    id: 'location',
    name: 'Localização',
    description: 'Cidades, masmorras ou pontos de interesse',
    content: `---
type: location
icon: ""
images: []
music: ""
linked_characters: []
fields:
  Região: ""
  Clima: ""
  População: ""
---

# Nova Localização

Descreva o local aqui...`
  }
];

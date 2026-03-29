export interface Template {
  id: string;
  name: string;
  description: string;
  content: string;
}

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
icon: "📍"
fields:
  Região: ""
  População: ""
  Perigo: "Baixo"
---

# Nova Localização

Descreva o local aqui...`
  },
  {
    id: 'session',
    name: 'Sessão de Jogo',
    description: 'Resumo de sessões e eventos',
    content: `---
type: session
data: "${new Date().toLocaleDateString('pt-BR')}"
---

# Sessão de Hoje

### Resumo dos Eventos
- 

### NPCs Encontrados
- 

### Itens Obtidos
- `
  }
];

export interface Template {
  id: string;
  name: string;
  content: string;
}

export const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 'character',
    name: '👤 Ficha de Personagem',
    content: `---
Nome: 
Idade: 
Ocupação: 
Classe: 
Localização: 
---

# Descrição Física
Escreva aqui...

# Personalidade
Escreva aqui...

# História (Backstory)
Escreva aqui...

# Motivações e Objetivos
Escreva aqui...`
  },
  {
    id: 'chapter',
    name: '📖 Estrutura de Capítulo',
    content: `---
Capítulo: 
Ponto de Vista: 
Local: 
---

# Resumo do Capítulo
*O que acontece aqui?*

# Objetivo da Cena
*Qual a mudança de estado dos personagens?*

---

# Início da Escrita
Comece aqui...`
  },
  {
    id: 'worldbuilding',
    name: '🌍 Worldbuilding Log',
    content: `---
Tipo: 
Região: 
Época: 
---

# Descrição Geral
Escreva aqui...

# Regras e Leis
Escreva aqui...

# Cultura e Tradições
Escreva aqui...

# Geografia/Clima
Escreva aqui...`
  }
];

import areas from '../questoes/areas.json';

// CRA loads every question image at build time through require.context.
const contextoQuestoes = require.context('../questoes', false, /\.png$/);
export const imagensQuestoes = {};

export const questoes = contextoQuestoes.keys().map((caminho) => {
  const id = caminho.replace('./', '').replace('.png', '');
  imagensQuestoes[id] = contextoQuestoes(caminho);
  return id;
}).sort();

export const questoesPorArea = questoes.reduce((porArea, id) => {
  const area = areas[id] || 'Outras';
  if (!porArea[area]) porArea[area] = [];
  porArea[area].push(id);
  return porArea;
}, {});

Object.keys(questoesPorArea).forEach((area) => questoesPorArea[area].sort());

export { areas };

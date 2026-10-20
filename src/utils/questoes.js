import seedrandom from 'seedrandom';

export function embaralharComSeed(array, ra) {
  const rng = seedrandom(ra);
  return [...array].sort(() => rng() - 0.5);
}

export function formatarTituloQuestao(id) {
  const match = id.match(/^(\d{4})([DOdo])(\d+)$/);
  if (!match) return id;

  const [, ano, tipo, numero] = match;
  const tipoExtenso = tipo.toUpperCase() === 'O' ? 'Objetiva' : 'Dissertativa';
  return `Questão ${tipoExtenso} ${numero}, ${ano}`;
}

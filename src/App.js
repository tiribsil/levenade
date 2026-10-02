import { useState } from 'react';
import { supabase } from './supabaseClient';
import seedrandom from 'seedrandom';

// 1. Faz a leitura automática da pasta src/questoes
const contextoQuestoes = require.context('./questoes', false, /\.png$/);
const imagensQuestoes = {};

const questoes = contextoQuestoes.keys().map((caminho) => {
  const id = caminho.replace('./', '').replace('.png', '');
  imagensQuestoes[id] = contextoQuestoes(caminho);
  return id;
}).sort();

function embaralharComSeed(array, ra) {
  const rng = seedrandom(ra);
  const copia = [...array];
  return copia.sort(() => rng() - 0.5);
}

function formatarTituloQuestao(id) {
  const match = id.match(/^(\d{4})([DOdo])(\d+)$/);
  if (!match) return id;

  const [, ano, tipo, numero] = match;
  const tipoExtenso = tipo.toUpperCase() === 'O' ? 'Objetiva' : 'Dissertativa';
  
  return `Questão ${tipoExtenso} ${numero}, ${ano}`;
}

export default function App() {
  const [ra, setRa] = useState('');
  const [listaQuestoes, setListaQuestoes] = useState([]); 
  const [iniciou, setIniciou] = useState(false);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [notaAtual, setNotaAtual] = useState(3);
  const [carregando, setCarregando] = useState(false);

  // 1. Ao digitar o RA, busca o que o aluno já respondeu antes
  async function entrarComRA(e) {
    e.preventDefault();
    if (!ra.trim()) return;

    setCarregando(true);

    // Embaralha as questões para este RA
    const embaralhadas = embaralharComSeed(questoes, ra.trim());
    setListaQuestoes(embaralhadas);

    const { data } = await supabase
      .from('avaliacoes')
      .select('questao_id, nota')
      .eq('ra', ra.trim());

    const historico = {};
    if (data) {
      data.forEach(item => { historico[item.questao_id] = item.nota; });
    }
    setRespostas(historico);

    // Encontra a primeira questão não respondida (aqui usa diretamente o ID)
    const proximaNaoRespondida = embaralhadas.findIndex(id => historico[id] === undefined);
    const indiceInicial = proximaNaoRespondida === -1 ? 0 : proximaNaoRespondida;
    
    setIndiceAtual(indiceInicial);
    setNotaAtual(historico[embaralhadas[indiceInicial]] ?? 3);
    setCarregando(false);
    setIniciou(true);
  }

  // 2. Salva a resposta no Supabase e vai para a próxima
  async function salvarEAvancar() {
    const questaoId = listaQuestoes[indiceAtual]; // Ex: "2021D3"

    // Atualiza localmente
    const novasRespostas = { ...respostas, [questaoId]: Number(notaAtual) };
    setRespostas(novasRespostas);

    // Salva no Supabase
    await supabase.from('avaliacoes').upsert({
      ra: ra.trim(),
      questao_id: questaoId,
      nota: Number(notaAtual)
    }, { onConflict: 'ra, questao_id' });

    // Avança para a próxima questão
    if (indiceAtual < listaQuestoes.length - 1) {
      const proxIndice = indiceAtual + 1;
      setIndiceAtual(proxIndice);
      setNotaAtual(novasRespostas[listaQuestoes[proxIndice]] ?? 3);
    } else {
      setIndiceAtual(listaQuestoes.length); // Fim
    }
  }

  function voltar() {
    if (indiceAtual > 0) {
      const prevIndice = indiceAtual - 1;
      setIndiceAtual(prevIndice);
      setNotaAtual(respostas[listaQuestoes[prevIndice]] ?? 3);
    }
  }

  // TELA 1: Identificação por RA
  if (!iniciou) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Priorização ENADE</h2>
          <p>Digite seu RA para carregar ou iniciar suas avaliações:</p>
          <form onSubmit={entrarComRA}>
            <input
              type="text"
              value={ra}
              onChange={(e) => setRa(e.target.value)}
              style={styles.input}
              required
            />
            <br />
            <button type="submit" disabled={carregando} style={styles.btnPrimary}>
              {carregando ? 'Buscando...' : 'Entrar / Continuar'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // TELA 3: Concluído
  if (indiceAtual >= listaQuestoes.length) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>Parabéns!</h2>
          <p>Você avaliou todas as {listaQuestoes.length} questões disponíveis.</p>
          <p>Seus dados estão salvos no RA: <strong>{ra}</strong></p>
          <button onClick={() => setIndiceAtual(0)} style={styles.btnSecondary}>
            Revisar respostas.
          </button>
        </div>
      </div>
    );
  }

  // TELA 2: Questionário
  const questaoId = listaQuestoes[indiceAtual];
  const labels = [
    '1 - Não tenho ideia de como resolver',
    '2 - Lembro muito pouco, não conseguiria chegar a uma resposta',
    '3 - Sei mais ou menos como resolver, talvez consiga chegar em uma resposta',
    '4 - Sei resolver, mas não teria certeza da resposta',
    '5 - Sei resolver com certeza da resposta'
  ];

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <span>RA: <strong>{ra}</strong></span>
          <span>
            Questão {indiceAtual + 1} de {listaQuestoes.length}
            <small style={{ color: '#888', marginLeft: '8px' }}>
              ({formatarTituloQuestao(questaoId)})
            </small>
          </span>
        </div>

        <div style={styles.boxTexto}>
          <img 
            src={imagensQuestoes[questaoId]} 
            alt={`Questão ${questaoId}`} 
            style={{ width: '100%', height: 'auto', display: 'block', margin: '0 auto' }} 
          />
        </div>

        <div style={styles.sliderContainer}>
          <label style={{ fontWeight: 'bold' }}>Sua facilidade com a questão:</label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={notaAtual}
            onChange={(e) => setNotaAtual(e.target.value)}
            style={{ width: '100%', margin: '15px 0' }}
          />
          <div style={styles.labelNota}>{labels[notaAtual - 1]}</div>
        </div>

        <div style={styles.buttonGroup}>
          <button 
            onClick={voltar} 
            disabled={indiceAtual === 0}
            style={indiceAtual === 0 ? styles.btnDisabled : styles.btnSecondary}
          >
            ← Voltar
          </button>
          <button onClick={salvarEAvancar} style={styles.btnPrimary}>
            {indiceAtual === listaQuestoes.length - 1 ? 'Finalizar ✓' : 'Confirmar e Próxima →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Estilos rápidos sem CSS externo
const styles = {
  container: { display: 'flex', justifyContent: 'center', padding: '20px', fontFamily: 'sans-serif' },
  card: { maxWidth: '700px', width: '100%', background: '#fff', border: '1px solid #ddd', borderRadius: '8px', padding: '24px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' },
  header: { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '10px', color: '#666', fontSize: '14px' },
  boxTexto: { background: '#f9f9f9', padding: '16px', borderRadius: '6px', margin: '20px 0', border: '1px solid #eee' },
  sliderContainer: { textAlign: 'center', margin: '25px 0' },
  labelNota: { fontSize: '15px', color: '#0056b3', fontWeight: 'bold' },
  buttonGroup: { display: 'flex', justifyContent: 'space-between', marginTop: '20px' },
  input: { padding: '10px', fontSize: '16px', width: '100%', boxSizing: 'border-box', marginBottom: '15px', borderRadius: '4px', border: '1px solid #ccc' },
  btnPrimary: { background: '#0066cc', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'pointer', fontSize: '15px', fontWeight: 'bold' },
  btnSecondary: { background: '#eee', color: '#333', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'pointer', fontSize: '15px' },
  btnDisabled: { background: '#f5f5f5', color: '#aaa', border: 'none', padding: '12px 20px', borderRadius: '5px', cursor: 'not-allowed' },
};
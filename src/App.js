import { useState } from 'react';
import { supabase } from './supabaseClient';
import seedrandom from 'seedrandom';
import areas from './questoes/areas.json';

// 1. Faz a leitura automática da pasta src/questoes
const contextoQuestoes = require.context('./questoes', false, /\.png$/);
const imagensQuestoes = {};

const questoes = contextoQuestoes.keys().map((caminho) => {
  const id = caminho.replace('./', '').replace('.png', '');
  imagensQuestoes[id] = contextoQuestoes(caminho);
  return id;
}).sort();

const questoesPorArea = {};
questoes.forEach((id) => {
  const area = areas[id] || 'Outras';
  if (!questoesPorArea[area]) questoesPorArea[area] = [];
  questoesPorArea[area].push(id);
});
Object.keys(questoesPorArea).forEach((area) => {
  questoesPorArea[area].sort();
});

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
  const [notaAtual, setNotaAtual] = useState(null);
  const [carregando, setCarregando] = useState(false);
  const [larguraTotal, setLarguraTotal] = useState(true);
  const [emGaleria, setEmGaleria] = useState(false);
  const [questaoDetalhe, setQuestaoDetalhe] = useState(null);

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
    setNotaAtual(historico[embaralhadas[indiceInicial]] ?? null);
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
      setNotaAtual(novasRespostas[listaQuestoes[proxIndice]] ?? null);
    } else {
      setIndiceAtual(listaQuestoes.length); // Fim
    }
  }

  function voltar() {
    if (indiceAtual > 0) {
      const prevIndice = indiceAtual - 1;
      setIndiceAtual(prevIndice);
      setNotaAtual(respostas[listaQuestoes[prevIndice]] ?? null);
    }
  }

  // TELA EXTRA 1: Visualizador de questão ampliada (da Galeria)
  if (emGaleria && questaoDetalhe) {
    const areaAtual = areas[questaoDetalhe] || 'Outras';
    const listaArea = questoesPorArea[areaAtual] || [];
    const indiceNaArea = listaArea.indexOf(questaoDetalhe);

    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <div style={styles.header}>
            <span>Área: <strong>{areaAtual}</strong></span>
            <span>
              {indiceNaArea + 1} de {listaArea.length}
              <small style={{ color: '#888', marginLeft: '6px' }}>
                ({formatarTituloQuestao(questaoDetalhe)})
              </small>
            </span>
          </div>

          <div style={styles.boxTexto}>
            <img 
              key={questaoDetalhe}
              src={imagensQuestoes[questaoDetalhe]} 
              alt={`Questão ${questaoDetalhe}`} 
              onLoad={(e) => {
                setLarguraTotal(e.currentTarget.naturalWidth > 500);
              }}
              style={{ 
                width: larguraTotal ? '100%' : '50%', 
                height: 'auto', 
                display: 'block', 
                margin: '0 auto' 
              }} 
            />
          </div>

          <div style={styles.buttonGroup}>
            <button 
              onClick={() => setQuestaoDetalhe(listaArea[indiceNaArea - 1])}
              disabled={indiceNaArea === 0}
              style={indiceNaArea === 0 ? styles.btnDisabled : styles.btnSecondary}
            >
              ← Questão Anterior
            </button>

            <button 
              onClick={() => setQuestaoDetalhe(null)}
              style={styles.btnSecondary}
            >
              Voltar para a Galeria
            </button>

            <button 
              onClick={() => setQuestaoDetalhe(listaArea[indiceNaArea + 1])}
              disabled={indiceNaArea === listaArea.length - 1}
              style={indiceNaArea === listaArea.length - 1 ? styles.btnDisabled : styles.btnSecondary}
            >
              Próxima Questão →
            </button>
          </div>
        </div>
      </div>
    );
  }

  // TELA EXTRA 2: Galeria de Miniaturas por Área
  if (emGaleria) {
    return (
      <div style={styles.container}>
        <div style={{ ...styles.card, maxWidth: '900px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h2 style={{ margin: 0 }}>Galeria por Áreas</h2>
            <button 
              onClick={() => setEmGaleria(false)}
              style={styles.btnPrimary}
            >
              ← Voltar ao Início
            </button>
          </div>

          {Object.entries(questoesPorArea).map(([area, lista]) => (
            <div key={area} style={{ marginBottom: '25px' }}>
              <h3 style={{ 
                borderBottom: `2px solid ${false ? '#444' : '#ddd'}`, 
                paddingBottom: '6px',
                fontSize: '16px',
                color: false ? '#66b2ff' : '#0066cc'
              }}>
                {area} ({lista.length} questões)
              </h3>

              {/* Grade de Miniaturas */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                gap: '10px',
                marginTop: '10px'
              }}>
                {lista.map((id) => (
                  <div
                    key={id}
                    onClick={() => setQuestaoDetalhe(id)}
                    style={{
                      border: `1px solid ${false ? '#444' : '#ccc'}`,
                      borderRadius: '6px',
                      padding: '5px',
                      cursor: 'pointer',
                      textAlign: 'center',
                      background: false ? '#222' : '#fafafa',
                      transition: 'transform 0.1s'
                    }}
                  >
                    <img 
                      src={imagensQuestoes[id]} 
                      alt={id}
                      style={{
                        width: '100%',
                        height: '80px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }} 
                    />
                    <div style={{ fontSize: '11px', marginTop: '4px', fontWeight: 'bold' }}>
                      {id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  // TELA 1: Identificação por RA
  if (!iniciou) {
    return (
      <div style={styles.container}>
        <div style={styles.card}>
          <h2>LevENADE</h2>
          <p>Essa é uma aplicação para levantamento de dificuldade das questões dos ENADEs passados, ajudando a comissão a focar nos assuntos mais importantes nos encontros de apoio.</p>
          <p>Digite seu RA para iniciar ou continuar suas avaliações:</p>
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
              {carregando ? 'Buscando...' : 'Entrar'}
            </button>
          </form>
          <p style={{
            marginTop: '20px',
            fontSize: '13px',
            textAlign: 'center',
            color: false ? '#aaa' : '#666'
          }}>
            Para ver todas as questões divididas por área de conhecimento,{' '}
            <button
              type="button"
              onClick={() => setEmGaleria(true)}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                color: false ? '#66b2ff' : '#0066cc',
                textDecoration: 'underline',
                fontSize: '13px',
                fontFamily: 'inherit'
              }}
            >
              clique aqui
            </button>.
          </p>
          <p style={{
            marginTop: '25px',
            fontSize: '13px',
            textAlign: 'center',
            color: '#666'
          }}>
            Para consultar as provas e gabaritos,{' '}
            <a
              href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enade/provas-e-gabaritos"
              target="_blank"
              rel="noreferrer"
              style={{
                color: '#0066cc',
                textDecoration: 'underline'
              }}
            >
              clique aqui
            </a>.
          </p>
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
          {areas[questaoId] && (
            <div style={{
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#666',
              textAlign: 'center',
              marginBottom: '10px'
            }}>
              {areas[questaoId]}
            </div>
          )}

          <img 
            key={questaoId}
            src={imagensQuestoes[questaoId]} 
            alt={`Questão ${questaoId}`} 
            onLoad={(e) => {
              // Verifica se a largura original do arquivo é maior que 500px
              const ehMaiorQue500 = e.currentTarget.naturalWidth > 500;
              setLarguraTotal(ehMaiorQue500);
            }}
            style={{ 
              width: larguraTotal ? '100%' : '50%', 
              height: 'auto', 
              display: 'block', 
              margin: '0 auto' 
            }} 
          />
        </div>

        <div style={styles.sliderContainer}>
          <label style={{ fontWeight: 'bold' }}>Sua facilidade com a questão:</label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={notaAtual ?? 3}
            onChange={(e) => setNotaAtual(Number(e.target.value))}
            style={{ width: '100%', margin: '15px 0' }}
          />
          <div style={{
            ...styles.labelNota,
            color: notaAtual === null ? (false ? '#aaa' : '#888') : styles.labelNota.color,
            fontStyle: notaAtual === null ? 'italic' : 'normal'
          }}>
            {notaAtual === null ? 'Mova a barra para classificar.' : labels[notaAtual - 1]}
          </div>
        </div>

        <div style={styles.buttonGroup}>
          <button 
            onClick={voltar} 
            disabled={indiceAtual === 0}
            style={indiceAtual === 0 ? styles.btnDisabled : styles.btnSecondary}
          >
            Voltar
          </button>
          <button 
            onClick={salvarEAvancar} 
            disabled={notaAtual === null}
            style={notaAtual === null ? styles.btnDisabled : styles.btnPrimary}
          >
            {indiceAtual === listaQuestoes.length - 1 ? 'Finalizar' : 'Confirmar'}
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
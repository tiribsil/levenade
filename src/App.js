import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { questoes } from './data/questoes';
import { embaralharComSeed } from './utils/questoes';
import CompletedPage from './components/CompletedPage';
import LoginPage from './components/LoginPage';
import QuestionDetail from './components/QuestionDetail';
import QuestionGallery from './components/QuestionGallery';
import QuestionnairePage from './components/QuestionnairePage';
import StatisticsPage from './components/StatisticsPage';

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
  const [dadosEstatisticas, setDadosEstatisticas] = useState([]);
  const [carregandoStats, setCarregandoStats] = useState(false);
  const [filtroArea, setFiltroArea] = useState('Todas');

  const [emModoView, setEmModoView] = useState(() => (
    window.location.hash === '#view' || window.location.pathname.endsWith('/view')
  ));

  useEffect(() => {
    function atualizarModoView() {
      setEmModoView(
        window.location.hash === '#view' || window.location.pathname.endsWith('/view')
      );
    }

    window.addEventListener('hashchange', atualizarModoView);
    window.addEventListener('popstate', atualizarModoView);
    return () => {
      window.removeEventListener('hashchange', atualizarModoView);
      window.removeEventListener('popstate', atualizarModoView);
    };
  }, []);

  async function entrarComRA(event) {
    event.preventDefault();
    if (!ra.trim()) return;

    setCarregando(true);
    const embaralhadas = embaralharComSeed(questoes, ra.trim());
    setListaQuestoes(embaralhadas);

    const { data } = await supabase
      .from('avaliacoes')
      .select('questao_id, nota')
      .eq('ra', ra.trim());

    const historico = {};
    if (data) data.forEach((item) => { historico[item.questao_id] = item.nota; });
    setRespostas(historico);

    const proximaNaoRespondida = embaralhadas.findIndex((id) => historico[id] === undefined);
    const indiceInicial = proximaNaoRespondida === -1 ? 0 : proximaNaoRespondida;
    setIndiceAtual(indiceInicial);
    setNotaAtual(historico[embaralhadas[indiceInicial]] ?? null);
    setCarregando(false);
    setIniciou(true);
  }

  async function salvarEAvancar() {
    const questaoId = listaQuestoes[indiceAtual];
    const novasRespostas = { ...respostas, [questaoId]: Number(notaAtual) };
    setRespostas(novasRespostas);

    await supabase.from('avaliacoes').upsert({
      ra: ra.trim(),
      questao_id: questaoId,
      nota: Number(notaAtual),
    }, { onConflict: 'ra, questao_id' });

    if (indiceAtual < listaQuestoes.length - 1) {
      const proxIndice = indiceAtual + 1;
      setIndiceAtual(proxIndice);
      setNotaAtual(novasRespostas[listaQuestoes[proxIndice]] ?? null);
    } else {
      setIndiceAtual(listaQuestoes.length);
    }
  }

  function voltar() {
    if (indiceAtual > 0) {
      const prevIndice = indiceAtual - 1;
      setIndiceAtual(prevIndice);
      setNotaAtual(respostas[listaQuestoes[prevIndice]] ?? null);
    }
  }

  async function carregarEstatisticas() {
    setCarregandoStats(true);
    const { data } = await supabase
      .from('estatisticas_questoes')
      .select('*')
      .order('media', { ascending: true });

    if (data) setDadosEstatisticas(data);
    setCarregandoStats(false);
  }

  useEffect(() => {
    if (emModoView) carregarEstatisticas();
  }, [emModoView]);

  if (questaoDetalhe) {
    return (
      <QuestionDetail
        questaoId={questaoDetalhe}
        emGaleria={emGaleria}
        larguraTotal={larguraTotal}
        onImageLoad={setLarguraTotal}
        onClose={() => setQuestaoDetalhe(null)}
        onSelectQuestion={setQuestaoDetalhe}
      />
    );
  }

  if (emModoView) {
    return (
      <StatisticsPage
        dados={dadosEstatisticas}
        filtroArea={filtroArea}
        onFilterChange={setFiltroArea}
        carregando={carregandoStats}
        onRefresh={carregarEstatisticas}
        onSelectQuestion={setQuestaoDetalhe}
      />
    );
  }

  if (emGaleria) {
    return <QuestionGallery onClose={() => setEmGaleria(false)} onSelectQuestion={setQuestaoDetalhe} />;
  }

  if (!iniciou) {
    return (
      <LoginPage
        ra={ra}
        onRaChange={setRa}
        onSubmit={entrarComRA}
        carregando={carregando}
        onOpenGallery={() => setEmGaleria(true)}
      />
    );
  }

  if (indiceAtual >= listaQuestoes.length) {
    return <CompletedPage totalQuestoes={listaQuestoes.length} ra={ra} onReview={() => setIndiceAtual(0)} />;
  }

  return (
    <QuestionnairePage
      ra={ra}
      questaoId={listaQuestoes[indiceAtual]}
      indiceAtual={indiceAtual}
      totalQuestoes={listaQuestoes.length}
      notaAtual={notaAtual}
      larguraTotal={larguraTotal}
      onImageLoad={setLarguraTotal}
      onNotaChange={setNotaAtual}
      onBack={voltar}
      onSaveAndAdvance={salvarEAvancar}
      onOpenGallery={() => setEmGaleria(true)}
    />
  );
}

import React from 'react';
import { areas, questoesPorArea } from '../data/questoes';
import { formatarTituloQuestao } from '../utils/questoes';

export default function StatisticsPage({ dados, filtroArea, onFilterChange, carregando, onRefresh, onSelectQuestion }) {
  const dadosFiltrados = dados.filter((item) => (
    filtroArea === 'Todas' || (areas[item.questao_id] || 'Outras') === filtroArea
  ));

  return (
    <div className="app-container">
      <div className="app-card app-card--statistics">
        <div className="statistics-heading-row">
          <div className="statistics-heading">
            <h2>Priorização das Questões</h2>
            <small>Ordenadas da menor facilidade para a maior</small>
          </div>
          <div className="statistics-controls">
            <select
              value={filtroArea}
              onChange={(event) => onFilterChange(event.target.value)}
            >
              <option value="Todas">Todas as Áreas</option>
              {Object.keys(questoesPorArea).map((area) => <option key={area} value={area}>{area}</option>)}
            </select>
            <button className="button button--primary" onClick={onRefresh} disabled={carregando}>
              {carregando ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>
        </div>
        <div className="statistics-table-wrapper">
          <table className="statistics-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Questão</th>
                <th>Área de Conhecimento</th>
                <th className="align-center">Média</th>
                <th className="align-center">Mediana</th>
                <th className="align-center">Moda</th>
                <th className="align-center">Desvio Padrão</th>
                <th className="align-center">Votos</th>
              </tr>
            </thead>
            <tbody>
              {dadosFiltrados.map((item, idx) => (
                <tr key={item.questao_id}>
                  <td className="statistics-rank">{idx + 1}º</td>
                  <td className="statistics-question" onClick={() => onSelectQuestion(item.questao_id)} title="Ver questão">
                    <span className="statistics-question-title">{formatarTituloQuestao(item.questao_id)}</span>
                    <small className="statistics-question-id">({item.questao_id})</small>
                  </td>
                  <td className="statistics-area">{areas[item.questao_id] || 'Outras'}</td>
                  <td className="statistics-average align-center">{item.media}</td>
                  <td className="align-center">{item.mediana}</td>
                  <td className="align-center">{item.moda}</td>
                  <td className="statistics-deviation align-center">±{item.desvio_padrao}</td>
                  <td className="align-center">{item.total_votos}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { areas, questoesPorArea, imagensQuestoes } from '../data/questoes';
import { formatarTituloQuestao } from '../utils/questoes';

export default function QuestionDetail({ questaoId, emGaleria, larguraTotal, onImageLoad, onClose, onSelectQuestion }) {
  const areaAtual = areas[questaoId] || 'Outras';
  const listaArea = questoesPorArea[areaAtual] || [];
  const indiceNaArea = listaArea.indexOf(questaoId);

  return (
    <div className="app-container">
      <div className="app-card">
        <div className="app-header">
          <span>Área: <strong>{areaAtual}</strong></span>
          <span>
            {indiceNaArea + 1} de {listaArea.length}
            <small className="question-detail-title">({formatarTituloQuestao(questaoId)})</small>
          </span>
        </div>
        <div className="question-box">
          <img
            key={questaoId}
            src={imagensQuestoes[questaoId]}
            alt={`Questão ${questaoId}`}
            onLoad={(event) => onImageLoad(event.currentTarget.naturalWidth > 500)}
            className={`question-image ${larguraTotal ? 'question-image--wide' : 'question-image--narrow'}`}
          />
        </div>
        <div className={`button-group ${emGaleria ? '' : 'button-group--center'}`}>
          {emGaleria && (
            <button
              onClick={() => onSelectQuestion(listaArea[indiceNaArea - 1])}
              disabled={indiceNaArea === 0}
              className="button button--secondary"
            >Questão Anterior</button>
          )}
          <button className="button button--secondary" onClick={onClose}>Voltar</button>
          {emGaleria && (
            <button
              onClick={() => onSelectQuestion(listaArea[indiceNaArea + 1])}
              disabled={indiceNaArea === listaArea.length - 1}
              className="button button--secondary"
            >Próxima Questão</button>
          )}
        </div>
      </div>
    </div>
  );
}

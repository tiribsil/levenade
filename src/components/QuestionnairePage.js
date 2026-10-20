import React from 'react';
import { areas, imagensQuestoes } from '../data/questoes';
import { formatarTituloQuestao } from '../utils/questoes';
import ResourceLinks from './ResourceLinks';

const labels = [
  '1 - Não tenho ideia de como resolver',
  '2 - Lembro muito pouco, não conseguiria chegar a uma resposta',
  '3 - Sei mais ou menos como resolver, talvez consiga chegar em uma resposta',
  '4 - Sei resolver, mas não teria certeza da resposta',
  '5 - Sei resolver com certeza da resposta',
];

export default function QuestionnairePage({
  ra, questaoId, indiceAtual, totalQuestoes, notaAtual, larguraTotal,
  onImageLoad, onNotaChange, onBack, onSaveAndAdvance, onOpenGallery,
}) {
  return (
    <div className="app-container">
      <div className="app-card">
        <div className="app-header">
          <span>RA: <strong>{ra}</strong></span>
          <span>
            Questão {indiceAtual + 1} de {totalQuestoes}
            <small className="question-detail-title question-detail-title--progress">({formatarTituloQuestao(questaoId)})</small>
          </span>
        </div>
        <div className="question-box">
          {areas[questaoId] && (
            <div className="question-area-label">
              {areas[questaoId]}
            </div>
          )}
          <img
            key={questaoId}
            src={imagensQuestoes[questaoId]}
            alt={`Questão ${questaoId}`}
            onLoad={(event) => onImageLoad(event.currentTarget.naturalWidth > 500)}
            className={`question-image ${larguraTotal ? 'question-image--wide' : 'question-image--narrow'}`}
          />
        </div>
        <div className="slider-container">
          <label><strong>Sua facilidade com a questão:</strong></label>
          <input
            type="range"
            min="1"
            max="5"
            step="1"
            value={notaAtual ?? 3}
            onChange={(event) => onNotaChange(Number(event.target.value))}
            className="rating-slider"
          />
          <div className={`rating-label ${notaAtual === null ? 'rating-label--empty' : ''}`}>
            {notaAtual === null ? 'Mova a barra para classificar.' : labels[notaAtual - 1]}
          </div>
        </div>
        <div className="button-group">
          <button className="button button--secondary" onClick={onBack} disabled={indiceAtual === 0}>Voltar</button>
          <button className="button button--primary" onClick={onSaveAndAdvance} disabled={notaAtual === null}>
            {indiceAtual === totalQuestoes - 1 ? 'Finalizar' : 'Confirmar'}
          </button>
        </div>
        <ResourceLinks onOpenGallery={onOpenGallery} />
      </div>
    </div>
  );
}

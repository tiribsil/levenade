import React from 'react';
import { imagensQuestoes, questoesPorArea } from '../data/questoes';

export default function QuestionGallery({ onClose, onSelectQuestion }) {
  return (
    <div className="app-container">
      <div className="app-card app-card--gallery">
        <div className="gallery-heading-row">
          <h2>Galeria por Áreas</h2>
          <button className="button button--primary" onClick={onClose}>Voltar</button>
        </div>
        {Object.entries(questoesPorArea).map(([area, lista]) => (
          <div key={area} className="gallery-area">
            <h3>
              {area} ({lista.length} questões)
            </h3>
            <div className="gallery-grid">
              {lista.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectQuestion(id)}
                  className="gallery-item"
                >
                  <img src={imagensQuestoes[id]} alt={id} />
                  <div className="gallery-item-label">{id}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

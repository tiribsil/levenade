import React from 'react';

export default function CompletedPage({ totalQuestoes, ra, onReview }) {
  return (
    <div className="app-container">
      <div className="app-card">
        <h2>Parabéns!</h2>
        <p>Você avaliou todas as {totalQuestoes} questões disponíveis.</p>
        <p>Seus dados estão salvos no RA: <strong>{ra}</strong></p>
        <button className="button button--secondary" onClick={onReview}>Revisar respostas.</button>
      </div>
    </div>
  );
}

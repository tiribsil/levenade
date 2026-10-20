import React from 'react';

export default function ResourceLinks({ onOpenGallery }) {
  return (
    <>
      <p className="resource-link">
        Para ver todas as questões divididas por área de conhecimento,{' '}
        <button
          type="button"
          onClick={onOpenGallery}
        >
          clique aqui
        </button>.
      </p>
      <p className="resource-link resource-link--exams">
        Para consultar as provas e gabaritos,{' '}
        <a
          href="https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enade/provas-e-gabaritos"
          target="_blank"
          rel="noreferrer"
        >
          clique aqui
        </a>.
      </p>
    </>
  );
}

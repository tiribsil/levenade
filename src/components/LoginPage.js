import React from 'react';
import ResourceLinks from './ResourceLinks';

export default function LoginPage({ ra, onRaChange, onSubmit, carregando, onOpenGallery }) {
  return (
    <div className="app-container">
      <div className="app-card">
        <h2>LevENADE</h2>
        <p>Essa é uma aplicação para levantamento de dificuldade das questões dos ENADEs passados, ajudando a comissão a focar nos assuntos mais importantes nos encontros de apoio.</p>
        <p>Digite seu RA para iniciar ou continuar suas avaliações:</p>
        <form onSubmit={onSubmit}>
          <input className="form-input" type="text" value={ra} onChange={(event) => onRaChange(event.target.value)} required />
          <br />
          <button className="button button--primary" type="submit" disabled={carregando}>
            {carregando ? 'Buscando...' : 'Entrar'}
          </button>
        </form>
        <ResourceLinks onOpenGallery={onOpenGallery} />
      </div>
    </div>
  );
}

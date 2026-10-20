import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the RA login screen', () => {
  render(<App />);
  expect(screen.getByRole('heading', { name: /levenade/i })).toBeInTheDocument();
  expect(screen.getByText(/Digite seu RA/i)).toBeInTheDocument();
});

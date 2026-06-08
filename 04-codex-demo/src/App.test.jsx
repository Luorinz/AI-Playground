import { fireEvent, render, screen } from '@testing-library/react';
import App from './App.jsx';

describe('App', () => {
  it('renders the game title', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /flappy bird/i })).toBeInTheDocument();
  });

  it('starts the game from the stage input', () => {
    render(<App />);

    expect(screen.getByRole('status')).toHaveTextContent(/ready/i);

    fireEvent.pointerDown(screen.getByRole('button', { name: /game area/i }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

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

  it('starts the game from the keyboard', () => {
    render(<App />);

    fireEvent.keyDown(window, { code: 'Space' });

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('hydrates the saved best score', async () => {
    window.localStorage.setItem('flappy-bird-codex-best-score', '9');

    render(<App />);

    await waitFor(() => expect(screen.getByText('9')).toBeInTheDocument());
  });
});

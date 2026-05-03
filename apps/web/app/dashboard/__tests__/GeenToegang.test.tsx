import React from 'react';
import { render, screen } from '@testing-library/react';
import { GeenToegang } from '../_components/GeenToegang';

describe('GeenToegang', () => {
  it('renders the "Geen toegang" heading', () => {
    render(<GeenToegang />);
    expect(screen.getByRole('heading', { name: 'Geen toegang' })).toBeInTheDocument();
  });

  it('renders the explanation text', () => {
    render(<GeenToegang />);
    expect(screen.getByText(/geen beheerdersrechten/i)).toBeInTheDocument();
  });

  it('renders a link back to /login', () => {
    render(<GeenToegang />);
    expect(screen.getByRole('link', { name: 'Uitloggen' })).toHaveAttribute('href', '/login');
  });
});

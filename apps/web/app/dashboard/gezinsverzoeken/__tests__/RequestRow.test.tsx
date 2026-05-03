import React from 'react';
import { render, screen } from '@testing-library/react';
import { RequestRow, type FamilyRequest } from '../_components/RequestRow';

const BASE: FamilyRequest = {
  id: 'req-1',
  first_name: 'Emma',
  last_name: 'Testdochter',
  birth_date: '2015-03-10',   // non-null so the birth_date cell does not also render '–'
  status: 'pending',
  created_at: '2026-04-26T10:00:00Z',
  profiles: null,
};

describe('RequestRow', () => {
  it('renders "–" for the requester name when profiles is null', () => {
    render(<RequestRow req={BASE} />);
    const strong = document.querySelector('strong');
    expect(strong?.textContent).toBe('–');
  });

  it('renders "–" for the requester name when profiles is an empty array', () => {
    render(<RequestRow req={{ ...BASE, profiles: [] }} />);
    const strong = document.querySelector('strong');
    expect(strong?.textContent).toBe('–');
  });

  it('renders the requester display_name and email from profiles', () => {
    render(<RequestRow req={{
      ...BASE,
      profiles: [{ display_name: 'Jan de Vries', email: 'jan@scmuiden.nl' }],
    }} />);
    expect(screen.getByText('Jan de Vries')).toBeInTheDocument();
    expect(screen.getByText('jan@scmuiden.nl')).toBeInTheDocument();
  });

  it('renders the family member name', () => {
    render(<RequestRow req={BASE} />);
    expect(screen.getByText('Emma Testdochter')).toBeInTheDocument();
  });

  it('renders the Dutch status label for pending status', () => {
    render(<RequestRow req={BASE} />);
    expect(screen.getByText('In behandeling')).toBeInTheDocument();
  });
});

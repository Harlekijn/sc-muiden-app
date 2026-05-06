import React from 'react';
import { render, screen } from '@testing-library/react-native';

jest.mock('lucide-react-native', () => ({
  CheckCircle: () => null,
}));

import { BardienstSectie } from '../BardienstSectie';

const baseAssignment = {
  id: 'ba-1',
  activity_id: 'act-1',
  member_id: 'member-1',
  confirmed_at: null,
  created_at: '2026-05-06T00:00:00.000Z',
  member: { id: 'member-1', first_name: 'Emma', last_name: 'Testdochter' },
};

describe('BardienstSectie', () => {
  // S07-A — Bardienst-sectie zichtbaar bij eigen toewijzing (happy path)
  it('S07-A: renders member name and Bevestigen button when assignment is not confirmed', () => {
    render(
      <BardienstSectie
        assignments={[baseAssignment]}
        onConfirm={jest.fn()}
        isConfirming={false}
        error={null}
      />,
    );
    expect(screen.getByText('Bardienst')).toBeTruthy();
    expect(screen.getByText('Emma Testdochter')).toBeTruthy();
    expect(screen.getByText('Bevestigen')).toBeTruthy();
  });

  // S07-C — Bardienst al bevestigd bij openen
  it('S07-C: renders Bevestigd badge when assignment is already confirmed', () => {
    render(
      <BardienstSectie
        assignments={[{ ...baseAssignment, confirmed_at: '2026-05-06T10:00:00.000Z' }]}
        onConfirm={jest.fn()}
        isConfirming={false}
        error={null}
      />,
    );
    expect(screen.getByText('Bevestigd')).toBeTruthy();
  });

  // S07-D — Bevestigen mislukt bij netwerkfout (error path)
  it('S07-D: renders Dutch error message when confirmation fails', () => {
    render(
      <BardienstSectie
        assignments={[baseAssignment]}
        onConfirm={jest.fn()}
        isConfirming={false}
        error="Kon niet bevestigen. Controleer je verbinding."
      />,
    );
    expect(screen.getByText('Kon niet bevestigen. Controleer je verbinding.')).toBeTruthy();
  });
});

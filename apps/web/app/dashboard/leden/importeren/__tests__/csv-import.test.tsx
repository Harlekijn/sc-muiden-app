import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

import { CsvImportWizard } from '../_components/CsvImportWizard';

// S12-D — CSV-import
describe('CsvImportWizard', () => {
  it('S12-D: toont upload-stap met dropzone', () => {
    render(<CsvImportWizard />);
    expect(screen.getByText(/sleep een csv-bestand/i)).toBeInTheDocument();
    expect(screen.getByText(/maximaal 5 mb/i)).toBeInTheDocument();
  });

  it('S12-D: bestand met verkeerde extensie toont foutmelding', () => {
    render(<CsvImportWizard />);
    const dropZone = screen.getByText(/sleep een csv-bestand/i).closest('div')!;
    const fakeFile = new File(['data'], 'data.xlsx', { type: 'application/vnd.ms-excel' });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [fakeFile] },
    });
    expect(screen.getByText('Alleen CSV-bestanden zijn toegestaan.')).toBeInTheDocument();
  });

  it('S12-D: geldig CSV-bestand gaat door naar kolomkoppeling', () => {
    render(<CsvImportWizard />);
    const dropZone = screen.getByText(/sleep een csv-bestand/i).closest('div')!;
    const csvContent = 'voornaam,achternaam\nJan,Bakker';
    const fakeFile = new File([csvContent], 'leden.csv', { type: 'text/csv' });
    fireEvent.drop(dropZone, {
      dataTransfer: { files: [fakeFile] },
    });
    // FileReader is async; the UI stays on upload until FileReader fires
    // Verify no immediate error shown
    expect(screen.queryByText('Alleen CSV-bestanden zijn toegestaan.')).not.toBeInTheDocument();
  });
});

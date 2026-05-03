import React from 'react';
import { Text } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { FormField } from '../ui/FormField';

describe('FormField', () => {
  it('renders the label text', () => {
    render(<FormField label="E-mailadres"><Text>input</Text></FormField>);
    expect(screen.getByText('E-mailadres')).toBeTruthy();
  });

  it('renders error text when the error prop is set', () => {
    render(
      <FormField label="E-mailadres" error="Ongeldig e-mailadres">
        <Text>input</Text>
      </FormField>
    );
    expect(screen.getByText('Ongeldig e-mailadres')).toBeTruthy();
  });

  it('does not render an error element when error is undefined', () => {
    render(<FormField label="E-mailadres"><Text>input</Text></FormField>);
    expect(screen.queryByText('Ongeldig e-mailadres')).toBeNull();
  });
});

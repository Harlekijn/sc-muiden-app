import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TextInput } from '../ui/TextInput';
import { colors } from '@sc-muiden/shared';

describe('TextInput', () => {
  it('forwards onChangeText to the underlying input', () => {
    const onChangeText = jest.fn();
    render(<TextInput onChangeText={onChangeText} placeholder="typ hier" />);
    fireEvent.changeText(screen.getByPlaceholderText('typ hier'), 'test waarde');
    expect(onChangeText).toHaveBeenCalledWith('test waarde');
  });

  it('applies blue border color when focused', () => {
    render(<TextInput placeholder="typ hier" containerTestID="container" />);
    const container = screen.getByTestId('container');
    fireEvent(screen.getByPlaceholderText('typ hier'), 'focus');
    expect(container).toHaveStyle({ borderColor: colors.blue });
  });

  it('removes focused border color when blurred', () => {
    render(<TextInput placeholder="typ hier" containerTestID="container" />);
    const container = screen.getByTestId('container');
    fireEvent(screen.getByPlaceholderText('typ hier'), 'focus');
    expect(container).toHaveStyle({ borderColor: colors.blue });
    fireEvent(screen.getByPlaceholderText('typ hier'), 'blur');
    expect(container).not.toHaveStyle({ borderColor: colors.blue });
  });
});

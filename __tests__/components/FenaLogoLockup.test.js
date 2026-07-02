import React from 'react';
import { render } from '@testing-library/react-native';
import { BRAND } from '../../src/brand/fena';
import { FenaLogoLockup } from '../../src/components/brand';
import { ThemeProvider } from '../../src/context/ThemeContext';

describe('FenaLogoLockup', () => {
  it('renders with brand accessibility label', () => {
    const { getByLabelText } = render(
      <ThemeProvider>
        <FenaLogoLockup width={200} />
      </ThemeProvider>,
    );
    expect(getByLabelText(BRAND.logoA11yLabel)).toBeTruthy();
  });
});

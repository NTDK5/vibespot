import React from 'react';
import { render } from '@testing-library/react-native';
import { BRAND } from '../../src/brand/fena';
import { FenaLogoLockup } from '../../src/components/brand';

describe('FenaLogoLockup', () => {
  it('renders with brand accessibility label', () => {
    const { getByLabelText } = render(<FenaLogoLockup width={200} />);
    expect(getByLabelText(BRAND.logoA11yLabel)).toBeTruthy();
  });
});

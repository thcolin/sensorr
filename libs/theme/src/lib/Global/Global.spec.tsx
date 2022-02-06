import React from 'react';
import { render } from '@testing-library/react';

import Global from './Global';

describe('Global', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<Global />);
    expect(baseElement).toBeTruthy();
  });
});

import { render, screen } from '@testing-library/react';
import { App } from '../../src/client/App';

describe('application shell', () => {
  it('identifies the tracker as unofficial within the main landmark', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'NYC Subway Train Time Tracker' })).toBeTruthy();
    expect(screen.getByText('Unofficial')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });
});

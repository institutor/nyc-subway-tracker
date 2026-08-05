import { render, screen } from '@testing-library/react';
import { App } from '../../src/client/App';
import { ControlledGeolocation, MemoryStorage, createClientApi } from '../helpers/client-fixtures';

describe('application shell', () => {
  it('identifies the tracker as unofficial within the main landmark', async () => {
    render(<App api={createClientApi()} geolocation={new ControlledGeolocation()} storage={new MemoryStorage()} />);

    await screen.findByText('Validation view');

    expect(screen.getByRole('heading', { name: 'NYC Subway Train Time Tracker' })).toBeTruthy();
    expect(screen.getByText('Unofficial')).toBeTruthy();
    expect(screen.getByRole('main')).toBeTruthy();
  });
});

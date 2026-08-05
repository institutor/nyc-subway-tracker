import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { StrictMode, useState } from 'react';
import { describe, expect, test } from 'vitest';

import { useLocation } from '../../src/client/hooks/use-location';

describe('zero-tap location request', () => {
  test.each([5, 1_000])('paints the purpose first and treats %s meter fixes identically', async (accuracy) => {
    const geolocation = new ControlledGeolocation();
    render(<LocationHarness geolocation={geolocation} />);

    expect(screen.getByText('Use your location to show nearby subway entrances and live arrivals.')).toBeTruthy();
    expect(geolocation.requests).toHaveLength(0);

    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, accuracy));
    await screen.findByText(`fix:40.7,-74,${accuracy}`);
  });

  test('ignores an older callback after retry owns the request', async () => {
    const geolocation = new ControlledGeolocation();
    render(<LocationHarness geolocation={geolocation} />);
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));

    fireEvent.click(screen.getByRole('button', { name: 'Try location again' }));
    await waitFor(() => expect(geolocation.requests).toHaveLength(2));
    await act(async () => geolocation.succeed(0, 5));
    expect(screen.queryByText('fix:40.7,-74,5')).toBeNull();
    await act(async () => geolocation.succeed(1, 700));
    await screen.findByText('fix:40.7,-74,700');
  });

  test('separates permission denial from a temporary position failure', async () => {
    const denied = new ControlledGeolocation();
    const deniedView = render(<LocationHarness geolocation={denied} />);
    await waitFor(() => expect(denied.requests).toHaveLength(1));
    await act(async () => denied.fail(0, 1));
    await screen.findByText('denied');
    deniedView.unmount();

    const temporary = new ControlledGeolocation();
    render(<LocationHarness geolocation={temporary} />);
    await waitFor(() => expect(temporary.requests).toHaveLength(1));
    await act(async () => temporary.fail(0, 2));
    await screen.findByText('failed');
  });

  test('starts exactly once when the production shell uses Strict Mode', async () => {
    const geolocation = new ControlledGeolocation();
    render(
      <StrictMode>
        <LocationHarness geolocation={geolocation} />
      </StrictMode>,
    );

    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
  });
});

function LocationHarness({ geolocation }: { readonly geolocation: Pick<Geolocation, 'getCurrentPosition'> }) {
  const [message, setMessage] = useState('idle');
  const location = useLocation({
    geolocation,
    onRequest: () => setMessage('requesting'),
    onFix: (_requestId, fix) => setMessage(`fix:${fix.coordinate.latitude},${fix.coordinate.longitude},${fix.accuracyMeters}`),
    onDenied: () => setMessage('denied'),
    onFailure: () => setMessage('failed'),
  });
  return (
    <main>
      <p>Use your location to show nearby subway entrances and live arrivals.</p>
      <p>{message}</p>
      <button type="button" onClick={location.retry}>Try location again</button>
    </main>
  );
}

class ControlledGeolocation implements Pick<Geolocation, 'getCurrentPosition'> {
  readonly requests: Array<{
    readonly success: PositionCallback;
    readonly failure: PositionErrorCallback | null | undefined;
  }> = [];

  getCurrentPosition(success: PositionCallback, failure?: PositionErrorCallback | null): void {
    this.requests.push({ success, failure });
  }

  succeed(index: number, accuracy: number): void {
    this.requests[index].success({
      coords: {
        latitude: 40.7, longitude: -74, accuracy,
        altitude: null, altitudeAccuracy: null, heading: null, speed: null,
        toJSON: () => ({ latitude: 40.7, longitude: -74, accuracy }),
      },
      timestamp: 1,
      toJSON: () => ({ timestamp: 1 }),
    });
  }

  fail(index: number, code: number): void {
    this.requests[index].failure?.({ code, message: 'browser detail', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 });
  }
}

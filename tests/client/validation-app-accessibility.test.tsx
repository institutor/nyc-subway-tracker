import '@testing-library/jest-dom/vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { App, selectCurrentValidationDecisionTime } from '../../src/client/App';
import type { BootstrapEnvelopeDto } from '../../src/client/api/client';
import {
  ControlledGeolocation,
  MemoryStorage,
  bootstrapEnvelope,
  createClientApi,
  nearbyEnvelope,
} from '../helpers/client-fixtures';

afterEach(() => document.body.replaceChildren());

describe('real App accessibility ownership', () => {
  test('uses only the current exact validation bootstrap to compose dynamic rider evidence', () => {
    expect(selectCurrentValidationDecisionTime(bootstrapEnvelope)).toBe(bootstrapEnvelope.decidedAt);

    const liveBootstrap: BootstrapEnvelopeDto = {
      ...bootstrapEnvelope,
      runtime: { mode: 'live', surface: 'public', availability: 'locked' },
    };
    expect(selectCurrentValidationDecisionTime(liveBootstrap)).toBeUndefined();
    expect(selectCurrentValidationDecisionTime(undefined)).toBeUndefined();
    expect(selectCurrentValidationDecisionTime({ ...bootstrapEnvelope, demonstrationLabel: undefined })).toBeUndefined();
    expect(selectCurrentValidationDecisionTime({
      ...bootstrapEnvelope,
      runtime: { ...bootstrapEnvelope.runtime, availability: 'locked' },
    })).toBeUndefined();
  });

  test('lets a rider change Accessible Route Only before Nearby ranking and posts the constraint on the acquired fix', async () => {
    const nearby = vi.fn(async () => nearbyEnvelope);
    const geolocation = new ControlledGeolocation();
    render(<App api={createClientApi({ nearby })} geolocation={geolocation} storage={new MemoryStorage()} />);

    const toggle = await screen.findByRole('checkbox', { name: 'Accessible Route Only' });
    expect(toggle).not.toBeChecked();
    fireEvent.click(toggle);
    expect(toggle).toBeChecked();
    await waitFor(() => expect(geolocation.requests).toHaveLength(1));
    await act(async () => geolocation.succeed(0, 18, { latitude: 40.811, longitude: -73.952 }));

    await waitFor(() => expect(nearby).toHaveBeenCalledWith({
      coordinate: { latitude: 40.811, longitude: -73.952 }, accuracyMeters: 18,
    }, true, expect.any(AbortSignal)));
  });
});

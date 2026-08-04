import { describe, expect, test } from 'vitest';

import { routeColorFor } from '../../src/shared/domain/route-colors';

const routeIds = ['1', '2', '3', '4', '5', '6', '7', 'A', 'C', 'E', 'B', 'D', 'F', 'M', 'G', 'J', 'Z', 'L', 'N', 'Q', 'R', 'W', 'S'];

describe('route colors', () => {
  test('keeps every official route background readable with its foreground text', () => {
    for (const id of routeIds) {
      const color = routeColorFor({ id, label: `Route ${id}` });
      expect(contrastRatio(color.foreground, color.background), id).toBeGreaterThanOrEqual(4.5);
      expect(color.routeLabel).toBe(`Route ${id}`);
    }
  });
});

function contrastRatio(left: string, right: string): number {
  const luminance = (color: string) => {
    const channels = color.slice(1).match(/.{2}/g)?.map((value) => Number.parseInt(value, 16) / 255) ?? [];
    const [red, green, blue] = channels.map((channel) => (
      channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
    ));
    return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  };
  const [lighter, darker] = [luminance(left), luminance(right)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

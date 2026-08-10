// @vitest-environment node

import { readFileSync } from 'node:fs';

import { describe, expect, it } from 'vitest';

const stylesheet = readFileSync(
  new URL('../../src/client/styles/global.css', import.meta.url),
  'utf8',
);

describe('mobile layout contract', () => {
  it('contains the sticky dock inside a fixed structural gutter at narrow widths', () => {
    expect(stylesheet).not.toContain('min-width: 20rem;');
    expect(stylesheet).toContain('--surface-gutter: var(--space-4);');
    expect(stylesheet).toContain('margin-inline: calc(var(--surface-gutter) * -1);');
    expect(stylesheet).toContain('padding-inline: var(--surface-gutter);');
    expect(stylesheet).toContain('--surface-gutter: 12px;');
    expect(stylesheet).toMatch(/@media \(max-width: 25rem\)[\s\S]*?\.context-dock \{\s*margin-inline: 0;\s*padding-inline: 8px;/u);
  });
});

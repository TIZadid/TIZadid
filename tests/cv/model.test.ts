import { describe, it, expect } from 'vitest';
import { parseBullets, toAscii } from '../../src/lib/cv/model';

describe('parseBullets', () => {
  it('reads dash and star bullets, trimming', () => {
    expect(parseBullets('- one\n* two  \n\n-   three')).toEqual(['one', 'two', 'three']);
  });
  it('ignores prose and returns [] for empty bodies', () => {
    expect(parseBullets('Just a paragraph.')).toEqual([]);
    expect(parseBullets('')).toEqual([]);
  });
  it('strips inline markdown', () => {
    expect(parseBullets('- **Bold** and [link](https://x.y) `code`')).toEqual(['Bold and link code']);
  });
});

describe('toAscii', () => {
  it('maps typographic characters and drops the rest', () => {
    expect(toAscii('“Hi” – it’s • 50 km… খেলা')).toBe('"Hi" - it\'s - 50 km... ');
  });
});

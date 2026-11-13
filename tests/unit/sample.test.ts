import { describe, expect, it } from 'vitest';
import { add } from './sample';

describe('add', () => {
  it('adds two numbers', () => {
    expect(add(2, 2)).toBe(4);
  });
});

const POP = new Uint8Array(256);
for (let i = 1; i < 256; i++) POP[i] = POP[i >> 1] + (i & 1);

export function wordCount(cardCount: number): number {
  return Math.ceil(cardCount / 32);
}

export function filledMask(cardCount: number, words: number): Uint32Array {
  const mask = new Uint32Array(words);
  mask.fill(0xffffffff);
  const remainder = cardCount & 31;
  if (remainder !== 0) mask[words - 1] = 0xffffffff >>> (32 - remainder);
  return mask;
}

export function setBit(bits: Uint32Array, index: number): void {
  bits[index >>> 5] |= 1 << (index & 31);
}

export function andInPlace(target: Uint32Array, other: Uint32Array): void {
  for (let i = 0; i < target.length; i++) target[i] &= other[i];
}

export function orInPlace(target: Uint32Array, other: Uint32Array): void {
  for (let i = 0; i < target.length; i++) target[i] |= other[i];
}

export function popcount(bits: Uint32Array): number {
  let total = 0;
  const pop = POP;
  for (let i = 0; i < bits.length; i++) {
    const value = bits[i];
    total +=
      pop[value & 255] + pop[(value >>> 8) & 255] + pop[(value >>> 16) & 255] + pop[value >>> 24];
  }
  return total;
}

/** Walk set bits. Returning false from `fn` stops the walk. */
export function forEachSetBit(
  bits: Uint32Array,
  cardCount: number,
  fn: (index: number) => boolean | void,
): void {
  const words = bits.length;
  for (let word = 0; word < words; word++) {
    let value = bits[word] >>> 0;
    while (value !== 0) {
      const lowest = value & -value;
      const trailing = 31 - Math.clz32(lowest);
      const index = (word << 5) + trailing;
      if (index >= cardCount) return;
      if (fn(index) === false) return;
      value = (value - (lowest >>> 0)) >>> 0;
    }
  }
}

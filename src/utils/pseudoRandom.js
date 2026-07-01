export const DEFAULT_A = 1664525;
export const DEFAULT_C = 1013904223;
export const DEFAULT_M = 4294967291; // número primo más grande menor que 2³²

export function createGenerator({ seed, a = DEFAULT_A, c = DEFAULT_C, m = DEFAULT_M } = {}) {
  let state = BigInt(seed !== undefined ? seed : Date.now());
  const bigA = BigInt(a);
  const bigC = BigInt(c);
  const bigM = BigInt(m);

  function next() {
    state = (bigA * state + bigC) % bigM;
    return Number(state) / m;
  }

  return { next };
}


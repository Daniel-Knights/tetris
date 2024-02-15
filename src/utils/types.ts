export type GeneratorYield<T> = Generator<T, never, T[]>;

type Repeat<T, N extends number, R extends unknown[] = []> = R["length"] extends N
  ? R
  : Repeat<T, N, [T, ...R]>;

export type RepeatingTuple<T, N extends number> = Repeat<T, N> extends infer R
  ? R
  : never;

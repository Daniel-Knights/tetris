export type GeneratorYield<T> = Generator<T, never, T[]>;

type Repeat<T, N extends number, R extends unknown[] = []> = R["length"] extends N
  ? R
  : Repeat<T, N, [T, ...R]>;

export type RepeatingTuple<T, N extends number> =
  Repeat<T, N> extends infer R ? R : never;

type NonFunctionKeys<T> = {
  // eslint-disable-next-line @typescript-eslint/ban-types
  [K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

export type PropertiesOnly<T> = Pick<T, NonFunctionKeys<T>>;

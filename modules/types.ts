export type PickOne<T> = {
  [P in keyof T]:
    & Record<P, T[P]>
    & Partial<Record<Exclude<keyof T, P>, undefined>>;
}[keyof T];

export type PickAny<T> = T extends Record<string, (infer S)> ? {
  [P in keyof T]:
    & Record<P, T[P]>
    & Partial<Record<Exclude<keyof T, P>, S>>;
}[keyof T]
  : never;

export function getKeys<T extends string | number | symbol>(
  object: Partial<Record<T, unknown>>,
) {
  return Object.keys(object) as T[];
}

export function getKey<T extends string | number | symbol>(
  object: PickOne<Record<T, unknown>>,
) {
  return Object.keys(object)[0] as T;
}

export function getValues<
  T extends string | number | symbol,
  S extends unknown,
>(
  object: Record<T, S>,
) {
  return Object.values(object) as S[];
}

export function getObject<
  K extends string | number | symbol,
  V extends unknown,
>(
  entries: [K, V][],
) {
  return Object.fromEntries(entries) as Record<K, V>;
}

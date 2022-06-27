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

// deno-lint-ignore no-explicit-any
export type Arguments<T extends (...args: any) => any> = {
  [K in keyof Parameters<T>]: Parameters<T>[K];
};

export function getKeys<T extends string>(object: PickAny<Record<T, unknown>>) {
  return Object.keys(object) as T[];
}

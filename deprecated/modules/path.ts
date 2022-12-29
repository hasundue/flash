export type Path = `/${string}`;

// deno-fmt-ignore
type PathParam<PathItem extends string> = PathItem extends `:${infer Key}`
  ? Key
  : never;

// deno-fmt-ignore
export type PathParams<Path extends string> =
  Path extends `${infer PathItem}/${infer Others}`
    ? PathParam<PathItem> | PathParams<Others>
    : PathParam<Path>;

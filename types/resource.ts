import { OperatorRecord } from "./operators.ts";

export interface ResourceSpecs {
  keys: Record<string, unknown>;
  body?: Record<string, unknown>; // TODO: extend to non-record types
  meta?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

export type Resource<
  R extends ResourceSpecs,
> = (context: {
  storage: ResourceStorage<R["keys"], R["body"], R["meta"]>;
  operators: OperatorRecord;
}) => {
  list?: (query: R["query"]) => Promise<(R["keys"] & R["body"] & R["meta"])[]>;
  get?: (keys: R["keys"]) => Promise<R["keys"] & R["body"] & R["meta"]>;
  put?: (
    keys: R["keys"],
    body: R["body"],
  ) => Promise<R["keys"] & R["body"] & R["meta"]>;
  set?: (keys: R["keys"], body: Partial<R["body"]>) => Promise<R["meta"]>;
};

export interface ResourceStorage<Keys, Body, Meta> {
  list: (
    query: Partial<
      {
        [K in keyof (Keys & Body & Meta)]: (
          it: (Keys & Body & Meta)[K],
        ) => boolean;
      }
    >,
  ) => Promise<(Keys & Body & Meta)[]>;
  get: (keys: Keys) => Promise<Keys & Body & Meta>;
  put: (keys: Keys, body: Body, meta: Meta) => Promise<void>;
  set: (
    keys: Keys,
    body: Partial<Body>,
    meta?: Partial<Meta>,
  ) => Promise<void>;
}

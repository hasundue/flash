export type Resource<
  R extends {
    keys: Record<string, unknown>;
    body?: unknown;
    meta?: Record<string, unknown>;
    query?: Record<string, unknown>;
  },
> = (args: {
  storage: ResourceStorage<R["keys"], R["body"], R["meta"]>;
}) => {
  list?: (query: R["query"]) => Promise<(R["keys"] & R["body"] & R["meta"])[]>;
  get?: (spec: R["keys"]) => Promise<R["keys"] & R["body"] & R["meta"]>;
  put?: (
    spec: R["keys"],
    body: R["body"],
  ) => Promise<R["keys"] & R["body"] & R["meta"]>;
  update?: (spec: R["keys"], body: Partial<R["body"]>) => Promise<R["meta"]>;
};

interface ResourceStorage<Spec, Body, Meta> {
  list: (
    query: Partial<
      {
        [K in keyof (Spec & Body & Meta)]: (
          it: (Spec & Body & Meta)[K],
        ) => boolean;
      }
    >,
  ) => Promise<(Spec & Body & Meta)[]>;
  get: (spec: Spec) => Promise<Spec & Body & Meta>;
  put: (resc: Spec, body: Body, meta: Meta) => Promise<void>;
  update: (
    spec: Spec,
    body: Partial<Body>,
    meta?: Partial<Meta>,
  ) => Promise<void>;
}

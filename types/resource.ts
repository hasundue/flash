export type Resource<
  R extends {
    spec: Record<string, unknown>;
    data?: Record<string, unknown>;
    meta?: Record<string, unknown>;
    query?: Record<string, unknown>;
  },
> = (args: {
  storage: ResourceStorage<R["spec"], R["data"] & R["meta"]>;
}) => {
  get?: (spec: R["spec"]) => Promise<R["spec"] & R["data"] & R["meta"]>;
  put?: (init: R["spec"] & R["data"]) => Promise<R["meta"]>;
  list?: (query: R["query"]) => Promise<(R["spec"] & R["data"] & R["meta"])[]>;
  create?: (spec: R["spec"]) => Promise<R["spec"] & R["data"] & R["meta"]>;
};

interface ResourceStorage<Spec, Type> {
  get: (spec: Spec) => Promise<Spec & Type>;
  put: (spec: Spec & Type) => Promise<void>;
  list: (
    query: Partial<
      { [K in keyof (Spec & Type)]: (it: (Spec & Type)[K]) => boolean }
    >,
  ) => Promise<(Spec & Type)[]>;
}

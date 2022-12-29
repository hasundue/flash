export type RestApiSpecs = RestApiObject;

type RestApiObject = Record<string, Resource<any>>;

type ResourceSpec = {
  spec: Record<string, unknown>;
  data?: Record<string, unknown>;
  meta?: Record<string, unknown>;
  query?: Record<string, unknown>;
};

export type Resource<
  S extends ResourceSpec,
> = (args: {
  storage: ResourceStorage<S["spec"], S["data"] & S["meta"]>;
}) => {
  get?: (spec: S["spec"]) => Promise<S["spec"] & S["data"] & S["meta"]>;
  put?: (init: S["spec"] & S["data"]) => Promise<S["meta"]>;
  list?: (query: S["query"]) => Promise<(S["spec"] & S["data"] & S["meta"])[]>;
  create?: (spec: S["spec"]) => Promise<S["spec"] & S["data"] & S["meta"]>;
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

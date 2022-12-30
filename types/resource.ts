import { AbstractBoolean, OperatorRecord } from "./operators.ts";

interface ResourceSpecs<BodyType> {
  keys: Record<string, unknown>;
  body?: BodyType;
  meta?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

export type AbstractResourceSpecs = ResourceSpecs<any>;

export type ResourceBodyRecord<R> = R extends ResourceSpecs<infer B>
  ? B extends Record<string, unknown> ? R["body"] : { body: R["body"] }
  : never;

export type ResourceObject<R extends AbstractResourceSpecs> =
  & R["keys"]
  & ResourceValue<R>;

export type ResourceValue<R extends AbstractResourceSpecs> =
  & ResourceBodyRecord<R>
  & R["meta"];

export type Resource<
  R extends AbstractResourceSpecs,
> = (context: {
  storage: ResourceStorage<R>;
  operators: OperatorRecord;
}) => {
  list?: (query: R["query"]) => Promise<ResourceObject<R>[]>;
  get?: (keys: R["keys"]) => Promise<ResourceObject<R>>;
  put?: (
    keys: R["keys"],
    body: R["body"],
  ) => Promise<void>;
  set?: (keys: R["keys"], body: Partial<R["body"]>) => Promise<void>;
};

export interface ResourceStorage<R extends AbstractResourceSpecs> {
  list: (
    query: Partial<
      {
        [K in keyof ResourceObject<R>]: (
          it: (ResourceObject<R>)[K],
        ) => AbstractBoolean;
      }
    >,
  ) => Promise<ResourceObject<R>[]>;
  get: (keys: R["keys"]) => Promise<ResourceObject<R>>;
  put: (keys: R["keys"], value: ResourceValue<R>) => Promise<void>;
  set: (
    keys: R["keys"],
    fields: Partial<ResourceValue<R>>,
  ) => Promise<void>;
}

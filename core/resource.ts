import { ConcreteQuery, Query, QueryOperatorRecord } from "./query.ts";

interface ResourceType<BodyType> {
  spec: Record<string, unknown>;
  body?: BodyType;
  meta?: Record<string, unknown>;
  query?: Record<string, unknown>;
}

export type AbstractResourceType = ResourceType<any>;

type ResourceBodyRecord<R> = R extends ResourceType<infer B>
  ? B extends Record<string, unknown> ? R["body"] : { body: R["body"] }
  : never;

export type ResourceObject<R extends AbstractResourceType> =
  & R["spec"]
  & ResourceValue<R>;

type ResourceValue<R extends AbstractResourceType> =
  & ResourceBodyRecord<R>
  & R["meta"];

export type Resource<
  R extends AbstractResourceType,
> = (context: {
  storage: ResourceStorage<R>;
  operators: QueryOperatorRecord;
}) => {
  list?: (query: R["query"]) => Promise<ResourceObject<R>[]>;
  get?: (keys: R["spec"]) => Promise<ResourceObject<R>>;
  put?: (keys: R["spec"], body: R["body"]) => Promise<void>;
  set?: (keys: R["spec"], body: Partial<R["body"]>) => Promise<void>;
};

export interface ResourceStorage<R extends AbstractResourceType> {
  list: (query: Query<ResourceObject<R>>) => Promise<ResourceObject<R>[]>;
  get: (keys: R["spec"]) => Promise<ResourceObject<R>>;
  put: (keys: R["spec"], value: ResourceValue<R>) => Promise<void>;
  set: (keys: R["spec"], fields: Partial<ResourceValue<R>>) => Promise<void>;
}

export interface ConcreteResourceStorage<R extends AbstractResourceType, C, T> {
  list: (
    query: ConcreteQuery<ResourceObject<R>, C, T>,
  ) => Promise<ResourceObject<R>[]>;
  get: (keys: R["spec"]) => Promise<ResourceObject<R>>;
  put: (keys: R["spec"], value: ResourceValue<R>) => Promise<void>;
  set: (
    keys: R["spec"],
    fields: Partial<ResourceValue<R>>,
  ) => Promise<void>;
}

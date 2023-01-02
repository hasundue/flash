import { ConcreteQueryOperatorRecord } from "./query.ts";
import {
  AbstractResourceType,
  ConcreteResourceStorage,
  Resource,
} from "./resource.ts";

export abstract class ResourceStorageFactory<C, T> {
  protected abstract operators: ConcreteQueryOperatorRecord<C, T>;

  abstract createResourceStorage<R extends AbstractResourceType>(
    resource: Resource<R>,
    root: string,
  ): ConcreteResourceStorage<R, C, T>;
}

export interface Application {
  resources: {
    name: string;
    alias: {
      singular: string;
      plural: string;
    };
    main: Resource<any>;
    storage: ResourceStorageFactory<any, any>;
  }[];
}

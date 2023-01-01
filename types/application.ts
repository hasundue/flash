import { ConcreteQueryOperatorRecord } from "./operators.ts";
import {
  AbstractResourceSpecs,
  ConcreteResourceStorage,
  Resource,
} from "./resource.ts";

export interface ResourceStorageFactory<C, T> {
  operators: ConcreteQueryOperatorRecord<C, T>;

  createResourceStorage<R extends AbstractResourceSpecs>(
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

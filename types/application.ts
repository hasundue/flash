import { OperatorRecord } from "./operators.ts";
import {
  AbstractResourceSpecs,
  Resource,
  ResourceStorage,
} from "./resource.ts";

export interface ResourceStorageFactory {
  operators: OperatorRecord;

  createResourceStorage<R extends AbstractResourceSpecs>(
    resource: Resource<R>,
    prefix: string,
  ): ResourceStorage<R>;
}

export type Application = {
  resources: {
    name: string;
    alias: {
      singular: string;
      plural: string;
    };
    main: Resource<any>;
    storage: ResourceStorageFactory;
  }[];
};

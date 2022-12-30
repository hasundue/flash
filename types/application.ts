import { Resource, ResourceSpecs, ResourceStorage } from "./resource.ts";

// export type ResourceStorageFactory = <R extends ResourceSpecs>(config: {
//   resource: Resource<R>;
//   prefix: string;
// }) => ResourceStorage<R["keys"], R["body"], R["meta"]>;

export interface ResourceStorageFactory {
  createResourceStorage<R extends ResourceSpecs>(
    resource: Resource<R>,
    prefix: string,
  ): ResourceStorage<R["keys"], R["body"], R["meta"]>;
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

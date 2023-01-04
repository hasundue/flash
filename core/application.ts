import { Resource } from "./resource.ts";
import { StorageAdapter } from "./storage.ts";

export interface Application {
  resources: {
    name: string;
    alias: {
      singular: string;
      plural: string;
    };
    main: Resource<any>;
    storage: StorageAdapter<any, any>;
  }[];
}

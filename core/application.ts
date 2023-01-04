import { StorageAdapter } from "./storage.ts";

export interface Application {
  resources: {
    name: string;
    alias: {
      singular: string;
      plural: string;
    };
    src: string;
    storage: StorageAdapter<any, any>;
  }[];
}

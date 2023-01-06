import { StorageAdapter } from "./storage.ts";

export interface Application {
  resources: {
    alias: {
      singular: string;
      plural: string;
    };
    source: string;
    storage: StorageAdapter<any, any>;
  }[];
}

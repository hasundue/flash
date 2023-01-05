import { StorageAdapter } from "./storage.ts";

export interface Application {
  resources: {
    alias: string;
    source: string;
    storage: StorageAdapter<any, any>;
  }[];
}

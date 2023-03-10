import { StorageAdapter } from "../core/storage.ts";

export class MockStorage extends StorageAdapter<string, boolean> {
  constructor() {
    super(
      "Mock Storage",
      {
        eq: (value) => (field) => !value || field === value,
        gt: (value) => (field) => !value || field > value,
        lt: (value) => (field) => !value || field < value,
      },
      () => {},
    );
  }
}

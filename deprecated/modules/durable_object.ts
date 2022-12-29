import type {
  DurableObjectNamespace as Namespace,
  DurableObjectState as State,
  DurableObjectStorageValue as StorageValue,
  DurableObjectStub as Stub,
} from "../deps.ts";

export type { Namespace, State, StorageValue, Stub };

export function fetch(
  namespace: Namespace,
  name: string,
  request: RequestInfo,
) {
  const id = namespace.idFromName(name);
  const stub = namespace.get(id);
  return stub.fetch(request);
}

export class WorkerStorage {
}

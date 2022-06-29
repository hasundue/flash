import type {
  DurableObjectNamespace as Namespace,
  DurableObjectState as State,
  DurableObjectStub as Stub,
} from "../deps.ts";

export type { Namespace, State, Stub };

export function fetch(
  namespace: Namespace,
  name: string,
  request: RequestInfo,
) {
  const id = namespace.idFromName(name);
  const stub = namespace.get(id);
  return stub.fetch(request);
}

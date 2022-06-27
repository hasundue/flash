import { flare, WorkerRouteHandler } from "../mod.ts";
import {
  DurableObjectNamespace,
  DurableObjectState,
  DurableObjectStub,
} from "https://pax.deno.dev/skymethod/denoflare@v0.5.2/common/cloudflare_workers_types.d.ts";

declare module "../mod.ts" {
  interface WorkerEnv {
    readonly DATA_STACK: DurableObjectNamespace;
  }
}

export default flare({});

const handler: WorkerRouteHandler = ({ env }) => env.DATA_STACK;

export class DataStack {
}

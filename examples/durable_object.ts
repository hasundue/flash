import { rest } from "../mod.ts";
import {
  DurableObjectNamespace,
  DurableObjectState,
  DurableObjectStub,
} from "https://pax.deno.dev/skymethod/denoflare@v0.5.2/common/cloudflare_workers_types.d.ts";

type WorkerEnv = {
  readonly DATA_STACK: DurableObjectNamespace;
};

export default rest({
  "/:name": {
    "GET": ({ params }, env: WorkerEnv) => {
      const id = env.DATA_STACK.idFromName(params.name);
      return { name: params.name, id };
    },
  },

  404: { message: "Not Found", status: 404 },
});

export class DataStack {
}

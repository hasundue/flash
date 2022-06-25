import { flash } from "../mod.ts";
import { DurableObjectNamespace } from "https://pax.deno.dev/skymethod/denoflare@v0.5.2/common/cloudflare_workers_types.d.ts";

declare type WorkerEnv = {
  readonly do: DurableObjectNamespace;
};

export default flash({
  "/:name": {
    "GET": ({ params }, env: WorkerEnv) => {
      const id = env.do.idFromName(params.name);
      return { name: params.name, id };
    },
  },

  404: { message: "Not Found", status: 404 },
});

export class DO {
}

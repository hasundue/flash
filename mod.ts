import type { IncomingRequestCf, ModuleWorkerContext } from "./deps.ts";

import { Router, Routes } from "./router.ts";
import { json } from "./response.ts";

export type {
  MethodRoutes,
  RouterHandler,
  RouterHandlerArgs,
  Routes,
} from "./router.ts";

export type ModuleWorkerEnv = Record<string, unknown>;

export interface Worker {
  fetch: (
    request: IncomingRequestCf,
    env: ModuleWorkerEnv,
    context: ModuleWorkerContext,
  ) => Response | Promise<Response>;
}

export type WorkerHandlerArgs = {
  request: IncomingRequestCf;
  env: ModuleWorkerEnv;
  context: ModuleWorkerContext;
};

export interface ResponseObject extends ResponseInit {
  [field: string]: unknown;
}

export type WorkerHandler = (
  request: IncomingRequestCf,
  env: ModuleWorkerEnv,
  context: ModuleWorkerContext,
) => Promise<ResponseObject> | ResponseObject;

/** flash() receives routes and returns a Module Worker interface
 * for denoflare.
 *
 * @example
 * ```typescript
 * import { flash } from "https://deno.land/x/flash/mod.ts";
 *
 * export default flash({
 *   "/": ({ request }) => {
 *     const country = request.cf.country;
 *     return { message: `Welcome from ${country}!` };
 *   },
 *
 *  "/echo/:name": {
 *     GET: ({ params }) => {
 *       return { name: params.name };
 *     },
 *   },
 *
 *   404: { message: "Not found" },
 * });
 * ```
 */
export function flash(routes: Routes): Worker {
  const router = new Router(routes);

  return {
    fetch: async (request, env, context) => {
      const handler = router.exec(request);
      const obj = await handler(request, env, context);
      return json(
        obj as Exclude<ResponseObject, ResponseInit>,
        obj,
      );
    },
  };
}

import type { IncomingRequestCf, ModuleWorkerContext, Status } from "./deps.ts";

import { ErrorHandler, Rest, Router } from "./router.ts";
import { defaultFormatter, Formatter } from "./formatter.ts";
import { ResponseObject } from "./response.ts";

export type { Formatter } from "./formatter.ts";
export { defaultFormatter } from "./formatter.ts";

export type {
  Method,
  MethodRoutes,
  Rest,
  RouterHandler,
  RouterHandlerArgs,
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

export type WorkerHandler = (
  request: IncomingRequestCf,
  env: ModuleWorkerEnv,
  context: ModuleWorkerContext,
) => Promise<ResponseObject> | ResponseObject;

export class NotFound extends Error {}

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
 *   404: { message: "Not found", status: 404 },
 * });
 * ```
 */
export function rest(
  routes: Rest,
  formatter: Formatter = defaultFormatter,
): Worker {
  const router = new Router(routes);

  return {
    fetch: async (request, env, context) => {
      try {
        const handler = router.exec(request);
        const response = await handler(request, env, context);
        return formatter(response);
      } catch (error) {
        let obj: ErrorHandler | ResponseObject;
        let status: Status;

        if (error instanceof NotFound) {
          obj = router.errors[404];
          status = 404;
        } else {
          obj = router.errors[500];
          status = 400;
        }

        const response = ErrorHandler.guard(obj)
          ? await obj({ request, context, error }, env)
          : obj;

        return formatter(response, status);
      }
    },
  };
}

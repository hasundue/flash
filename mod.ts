import type { IncomingRequestCf, ModuleWorkerContext } from "./deps.ts";

import { Router, Routes } from "./router.ts";
import { Formatter, json } from "./formatter.ts";

export type { Formatter } from "./formatter.ts";
export { json } from "./formatter.ts";

export type {
  Method,
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

export type WorkerHandler = (
  request: IncomingRequestCf,
  env: ModuleWorkerEnv,
  context: ModuleWorkerContext,
) => Promise<AbstractResponse> | AbstractResponse;

export interface ResponseObject extends ResponseInit {
  [field: string]: unknown;
}

export const ResponseObject = {
  guard(res: AbstractResponse): res is ResponseObject {
    return typeof res === "object";
  },
};

export type ResponseMessage = `${number}: ${string}`;

export const ResponseMessage = {
  guard(res: AbstractResponse): res is ResponseMessage {
    if (typeof res === "object") return false;
    else return res.match(/^\d+: .*$/) !== null;
  },
  status(res: ResponseMessage): number | undefined {
    const matched = res.match(/^\d+(?=: .*$)/);
    return matched ? parseInt(matched[0]) : undefined;
  },
  message(res: ResponseMessage): string | undefined {
    const matched = res.match(/(?<=^\d+: ).*$/);
    return matched ? matched[0] : undefined;
  },
};

export type AbstractResponse = ResponseObject | ResponseMessage | string;

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
export function flash(routes: Routes, formatter: Formatter = json): Worker {
  const router = new Router(routes);

  return {
    fetch: async (request, env, context) => {
      const handler = router.exec(request);
      const res = await handler(request, env, context);
      return formatter(res);
    },
  };
}

import type {
  ErrorStatus,
  IncomingRequestCf,
  ModuleWorkerContext,
  Status,
} from "./deps.ts";

// import { ErrorHandler, Rest, Router } from "./router.ts";
// import { defaultFormatter, Formatter } from "./formatter.ts";
// import { ResponseObject } from "./response.ts";

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

// export class NotFound extends Error {}

type Routes<H extends Handler> =
  & {
    [path: PathString]: RouteValue<H>;
  }
  & Partial<
    {
      [code in ErrorStatus]: RouteValue<H>;
    }
  >;

type RouteValue<H extends Handler> = H | ResponseLike;

type ResponseLike = Response | string;

export interface Router<H extends Handler> {
  constructor: (routes: Routes<H>) => Router<H>;
  exec: (request: Request) => [RouteValue<H>, Responder<H>];
}

interface Handler {
  (request: Request): Response | Promise<Response>;
}

function isHandler<H extends Handler>(value: RouteValue<H>): value is Handler {
  return typeof value === "function";
}

interface WorkerHandler extends Handler {
  (
    request: IncomingRequestCf,
    env: ModuleWorkerEnv,
    context: ModuleWorkerContext,
  ): ReturnType<Handler>;
}

interface DurableObjectHandler extends Handler {
  (
    request: Request,
    init?: RequestInit,
  ): ReturnType<Handler>;
}

type Responder<H extends Handler> = (
  ...args: Parameters<H>
) => (value: RouteValue<H>) => ReturnType<H>;

type PathString = `/${string}`;

/** flash() receives routes and returns a Module Worker interface
 * for denoflare.
 */
export function flare(routes: Routes<WorkerHandler>): Worker {
  const router: Router<WorkerHandler> = new Router(routes);

  return {
    fetch: async (request, env, context) => {
      const [value, responder] = router.exec(request);
    },
  };
}

export function fetcher(
  routes: Routes<DurableObjectHandler>,
): DurableObjectHandler {
  const router: Router<DurableObjectHandler> = new Router(routes);
  return async (request, init?) => {
    const [value, responder] = router.exec(request);
    return await responder(request, init)(value);
  };
}

import type {
  ErrorStatus,
  IncomingRequestCf,
  ModuleWorkerContext,
} from "./deps.ts";

export type ModuleWorkerEnv = Record<string, unknown>;

interface Worker {
  fetch: WorkerHandler;
}

type WorkerHandler = (
  request: IncomingRequestCf,
  env: ModuleWorkerEnv,
  context: ModuleWorkerContext,
) => Response | Promise<Response>;

type DurableObjectHandler = (
  request: Request,
  init?: RequestInit,
) => Response | Promise<Response>;

type Handler = WorkerHandler | DurableObjectHandler;

type Routes<H extends Handler> =
  & {
    [path: PathString]: RouteValue<H>;
  }
  & Partial<
    {
      [code in ErrorStatus]: RouteValue<H>;
    }
  >;

type PathString = `/${string}`;

type RouteValue<H extends Handler> = H | ResponseLike;

type ResponseLike = Response | string;

export interface Router<H extends Handler> {
  constructor: (routes: Routes<H>) => Router<H>;
  exec: (request: Request) => [RouteValue<H>, Formatter];
}

type Formatter = (precursor: ResponseLike) => Response;

export function flare(routes: Routes<WorkerHandler>): Worker {
  const router: Router<WorkerHandler> = new Router(routes);
  return {
    fetch: async (request, env, context) => {
      const [value, formatter] = router.exec(request);
      const precursor = typeof value === "function"
        ? await value(request, env, context)
        : value;
      return formatter(precursor);
    },
  };
}

export function fetcher(
  routes: Routes<DurableObjectHandler>,
): DurableObjectHandler {
  const router: Router<DurableObjectHandler> = new Router(routes);
  return async (request, init?) => {
    const [value, formatter] = router.exec(request);
    const precursor = typeof value === "function"
      ? await value(request, init)
      : value;
    return formatter(precursor);
  };
}

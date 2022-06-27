import type {
  ErrorStatus,
  IncomingRequestCf,
  ModuleWorkerContext,
} from "./deps.ts";

export interface WorkerEnv {
}

type Context = Worker | DurableObject;

type Worker = "Worker";
type DurableObject = "DurableObject";

type Handler<C extends Context> = C extends Worker ? WorkerHandler
  : DurableObjectHandler;

type WorkerHandler = (
  request: IncomingRequestCf,
  env: WorkerEnv,
  context: ModuleWorkerContext,
) => Response | Promise<Response>;

type DurableObjectHandler = (
  request: Request,
  init?: RequestInit,
) => Response | Promise<Response>;

type Routes<C extends Context> =
  & {
    [path: PathString]: RouteValue<C>;
  }
  & Partial<
    {
      [code in ErrorStatus]: RouteValue<C>;
    }
  >;

type PathString = `/${string}`;

type RouteValue<C extends Context> = RouteHandler<C> | ResponseLike;

type RouteHandler<C extends Context> = C extends Worker ? WorkerRouteHandler
  : DurableObjectRouteHandler;

export type WorkerRouteHandler = (args: {
  request: IncomingRequestCf;
  env: WorkerEnv;
  context: ModuleWorkerContext;
}) => ResponseLike | Promise<ResponseLike>;

type DurableObjectRouteHandler = (args: {
  request: IncomingRequestCf;
  env: WorkerEnv;
}) => ResponseLike | Promise<ResponseLike>;

type ResponseLike = Response | string;

export interface Router<C extends Context> {
  constructor: (routes: Routes<C>) => Router<C>;
  exec: (request: Request) => [Handler<C> | ResponseLike, Formatter];
}

type Formatter = (precursor: ResponseLike) => Response;

export function flare(routes: Routes<Worker>): {
  fetch: WorkerHandler;
} {
  const router: Router<Worker> = new Router(routes);
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
  routes: Routes<DurableObject>,
): DurableObjectHandler {
  const router: Router<DurableObject> = new Router(routes);
  return async (request, init?) => {
    const [value, formatter] = router.exec(request);
    const precursor = typeof value === "function"
      ? await value(request, init)
      : value;
    return formatter(precursor);
  };
}

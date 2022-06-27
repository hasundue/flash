import type { IncomingRequestCf, ModuleWorkerContext } from "./deps.ts";

import { Router, Routes } from "./modules/router.ts";
import { ResponseLike } from "./modules/response.ts";
import { Arguments } from "./modules/types.ts";

export interface WorkerEnv {
}

type WorkerRequest = IncomingRequestCf;
type WorkerContext = ModuleWorkerContext;

export type Context = Worker | DurableObject;

type Worker = "Worker";
type DurableObject = "DurableObject";

export type Handler<C extends Context> = C extends Worker ? WorkerHandler
  : DurableObjectHandler;

type WorkerHandler = (
  request: WorkerRequest,
  env: WorkerEnv,
  context: WorkerContext,
) => Response | Promise<Response>;

type DurableObjectHandler = (
  request: Request,
  init?: RequestInit,
) => Response | Promise<Response>;

export interface RouterInterface<C extends Context> {
  exec: (request: Request) => HandlerLike<C> | ResponseLike;
}

export type HandlerLike<C extends Context> = (
  ...args: Arguments<Handler<C>>
) => ResponseLike | Promise<ResponseLike>;

type Formatter = (precursor: ResponseLike) => Response;

export function flare(routes: Routes<Worker>, formatter: Formatter): {
  fetch: WorkerHandler;
} {
  const router = new Router(routes);
  return {
    fetch: async (request, env, context) => {
      const value = router.exec(request);
      const precursor = typeof value === "function"
        ? await value(request, env, context)
        : value;
      return formatter(precursor);
    },
  };
}

export function fetcher(
  routes: Routes<DurableObject>,
  formatter: Formatter,
): DurableObjectHandler {
  const router: Router<DurableObject> = new Router(routes);
  return async (request, init?) => {
    const value = router.exec(request);
    const precursor = typeof value === "function"
      ? await value(request, init)
      : value;
    return formatter(precursor);
  };
}

import type { IncomingRequestCf, ModuleWorkerContext } from "./deps.ts";

import { Router, Routes } from "./modules/router.ts";
import { ResponseLike } from "./modules/response.ts";
import { FormatInit, Formatter } from "./modules/formatter.ts";

export interface WorkerEnv {
}

type WorkerRequest = IncomingRequestCf;
type WorkerContext = ModuleWorkerContext;

export type Context = Worker | DurableObject;

export type Worker = "Worker";
export type DurableObject = "DurableObject";

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

export type HandlerArgs<C extends Context> = C extends Worker
  ? WorkerHandlerArgs
  : DurableObjectHandlerArgs;

type WorkerHandlerArgs = {
  request: WorkerRequest;
  env: WorkerEnv;
  context: WorkerContext;
};

type DurableObjectHandlerArgs = {
  request: Request;
  init?: RequestInit;
};

export type HandlerLike<C extends Context> = (
  args: HandlerArgs<C>,
) => ResponseLike | Promise<ResponseLike>;

export interface FormatterMethods {
  exec: (precursor: ResponseLike) => Response;
}

export type Flash<C extends Context> = Routes<C> & { format?: FormatInit };

export function flare(flash: Flash<Worker>): {
  fetch: WorkerHandler;
} {
  const { format, ...routes } = flash;

  const router = new Router(routes);
  const formatter = new Formatter(format);

  return {
    fetch: async (request, env, context) => {
      const value = router(request);
      const precursor = typeof value === "function"
        ? await value({ request, env, context })
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
    const value = router.call(request);
    const precursor = typeof value === "function"
      ? await value({ request, init })
      : value;
    return formatter(precursor);
  };
}

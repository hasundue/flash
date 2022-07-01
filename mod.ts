import type { WorkerContext, WorkerRequest } from "./deps.ts";

import { Router, Routes } from "./modules/router.ts";

// deno-lint-ignore no-empty-interface
export interface WorkerEnv {
}

export type Context = Worker | DurableObject;

export type Worker = "Worker";
export type DurableObject = "DurableObject";

export type Handler<C extends Context> = (
  ...args: HandlerParams<C>
) => Promise<Response>;

export type HandlerParams<C extends Context> = C extends Worker
  ? WorkerHandlerParams
  : DurableObjectHandlerParams;

type WorkerHandlerParams = [
  request: WorkerRequest,
  env: WorkerEnv,
  context: WorkerContext,
];

type DurableObjectHandlerParams = [
  request: Request,
  init: RequestInit,
];

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
  init: RequestInit;
};

function isWorkerHandlerParams(
  params: WorkerHandlerParams | DurableObjectHandlerParams,
): params is WorkerHandlerParams {
  return params.length === 3;
}

export function getHandlerArgs<C extends Context>(
  params: HandlerParams<C>,
): HandlerArgs<C> {
  if (isWorkerHandlerParams(params)) {
    // @ts-ignore: type error TODO:
    return {
      request: params[0],
      env: params[1],
      context: params[2],
    };
  } else {
    // @ts-ignore: type error TODO:
    return {
      request: params[0],
      init: params[1],
    };
  }
}

export interface RouterMethods<C extends Context> {
  route: (request: Request) => Handler<C>;
}

export function RestAPI<C extends Context>(routes: Routes<C>): Handler<C> {
  const router = new Router(routes);

  return async (...args: Parameters<Handler<C>>) => {
    const handler = router.route(args[0]);
    return await handler(...args);
  };
}

export function flare(routes: Routes<Worker>) {
  return {
    fetch: RestAPI(routes),
  };
}

export function fetcher(routes: Routes<DurableObject>) {
  return RestAPI(routes);
}

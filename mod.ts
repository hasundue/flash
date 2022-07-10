import type { WorkerContext, WorkerRequest } from "./deps.ts";

import {
  EntityType,
  Route,
  RouteKey,
  Router,
  Routes,
} from "./modules/router.ts";
import { Namespace as DurableObjectNamespace } from "./modules/durable_object.ts";

export type { Routes } from "./modules/router.ts";
export { Storage, WorkerStorage } from "./modules/storage.ts";

export interface WorkerEnv {
  storage: DurableObjectNamespace;
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

export function isWorkerHandlerArgs(
  args: HandlerArgs<Context>,
): args is HandlerArgs<Worker> {
  // @ts-ignore we have to check if args.env and args.env are not undefined
  return args.env !== undefined && args.env !== undefined;
}

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

export function RestAPI<
  C extends Context,
  Ks extends keyof R,
  R extends { [K in Ks]: Route<C, K> },
>(
  routes: Routes<C, Ks, R>,
): Handler<C> {
  const router = new Router(routes);

  return async (...args: Parameters<Handler<C>>) => {
    const handler = router.route(args[0]);
    return await handler(...args);
  };
}

export function flare<
  Ks extends keyof R,
  R extends { [K in Ks]: Route<Worker, K> },
>(
  routes: Routes<Worker, Ks, R>,
) {
  return {
    fetch: RestAPI(routes),
  };
}

export function fetcher<Ks extends RouteKey>(
  routes: Routes<DurableObject, Ks>,
) {
  return RestAPI(routes);
}

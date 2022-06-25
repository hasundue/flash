import {
  ModuleWorkerEnv,
  ResponseObject,
  WorkerHandler,
  WorkerHandlerArgs,
} from "./mod.ts";

export type Routes = {
  [path: string]: MethodRoutes | RouterHandler | ResponseObject;
  404: RouterHandler | ResponseObject;
};

const Methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof Methods[number];

// deno-lint-ignore no-explicit-any
function isMethod(obj: any): obj is Method {
  return Methods.includes(obj);
}

export type MethodRoutes = {
  [M in Method]?: RouterHandler | ResponseObject;
};

function isMethodRoutes(
  obj: MethodRoutes | RouterHandler | ResponseObject,
): obj is MethodRoutes {
  return typeof obj !== "function" && Object.keys(obj).every(isMethod);
}

export type PathParams = Record<string, string>;

export type RouterHandlerArgs = Omit<WorkerHandlerArgs, "env"> & {
  params: PathParams;
};

export type RouterHandler = (
  args: RouterHandlerArgs,
  env: ModuleWorkerEnv,
) => ResponseObject;

function isRouterHandler(
  obj: MethodRoutes | RouterHandler | ResponseObject,
): obj is RouterHandler {
  return typeof obj === "function";
}

function createWorkerHandler(
  obj: RouterHandler | ResponseObject,
  params?: PathParams,
): WorkerHandler {
  return (request, env, context) =>
    isRouterHandler(obj)
      ? obj({
        request,
        context,
        params: params ?? {},
      }, env)
      : obj;
}

export class Router {
  private routes: Routes;

  constructor(routes: Routes) {
    this.routes = routes;
  }

  exec(request: Request) {
    const { search, pathname } = new URL(request.url);

    const startTime = Date.now();

    for (const route of Object.keys(this.routes)) {
      const pattern = new URLPattern({ pathname: route });
      const params = pattern.exec({ pathname })?.pathname.groups;

      if (pattern.test({ pathname })) {
        const routed = this.routes[route];

        if (isMethodRoutes(routed)) {
          const methodRoutes = routed;

          for (const method of Object.keys(methodRoutes)) {
            if (method === request.method) {
              const routed = methodRoutes[method as Method] as
                | RouterHandler
                | ResponseObject;
              return createWorkerHandler(routed, params);
            }
          }
        } else {
          return createWorkerHandler(routed, params);
        }
      }
    }

    console.log(
      `${request.method} ${pathname + search} ${Date.now() - startTime}ms`,
    );

    return createWorkerHandler(this.routes[404]);
  }
}

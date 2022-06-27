import { ErrorStatus } from "./deps.ts";
import {
  ModuleWorkerEnv,
  NotFound,
  WorkerHandler,
  WorkerHandlerArgs,
} from "./mod.ts";
import { ResponseObject } from "./response.ts";

type PathString = `/${string}`;

type Routes = {
  [path: PathString]: MethodRoutes | RouterHandler | ResponseObject;
};

type Errors = {
  [code in ErrorStatus]: ErrorHandler | ResponseObject;
};

export type Rest = Routes & Partial<Errors>;

const Methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export const Method = {
  // deno-lint-ignore no-explicit-any
  guard(obj: any): obj is Method {
    return Methods.includes(obj);
  },
};

export type MethodRoutes = {
  [M in Method]?: RouterHandler | ResponseObject;
};

export const MethodRoutes = {
  guard(
    obj: MethodRoutes | RouterHandler | ResponseObject,
  ): obj is MethodRoutes {
    if (!obj || typeof obj !== "object") return false;
    return Object.keys(obj).every(Method.guard);
  },
};

export type PathParams = Record<string, string>;

export type RouterHandlerArgs = Omit<WorkerHandlerArgs, "env"> & {
  path: string;
  params: PathParams;
};

export type RouterHandler = (
  args: RouterHandlerArgs,
  env: ModuleWorkerEnv,
) => ResponseObject | Promise<ResponseObject>;

export const RouterHandler = {
  guard(
    obj: MethodRoutes | RouterHandler | ResponseObject,
  ): obj is RouterHandler {
    return typeof obj === "function";
  },
};

export type ErrorHandlerArgs = Omit<RouterHandlerArgs, "path" | "params"> & {
  error: Error;
};

export type ErrorHandler = (
  args: ErrorHandlerArgs,
  env: ModuleWorkerEnv,
) => ResponseObject | Promise<ResponseObject>;

export const ErrorHandler = {
  guard(
    obj: ErrorHandler | ResponseObject,
  ): obj is ErrorHandler {
    return typeof obj === "function";
  },
};

export const defaultNotFoundHandler: ErrorHandler = ({ request }) => {
  const url = new URL(request.url);
  return `Resource ${url.pathname} not found.`;
};

export const defaultErrorHandler: ErrorHandler = ({ error }) => {
  return {
    500: "Unexpected error occured.",
    stack: error.stack,
  };
};

function createWorkerHandler(
  obj: RouterHandler | ResponseObject,
  path: string,
  params?: PathParams,
): WorkerHandler {
  return (request, env, context) =>
    RouterHandler.guard(obj)
      ? obj({
        request,
        context,
        path,
        params: params ?? {},
      }, env)
      : obj;
}

export class Router {
}
// export class Router {
//   readonly routes: Routes;
//   readonly errors: Pick<Errors, 404 | 500> & Partial<Errors>;

//   constructor(rest: Rest) {
//     this.routes = rest as Routes;

//     const errors = rest as Partial<Errors>;
//     this.errors = {
//       ...errors,
//       404: errors[404] ?? defaultNotFoundHandler,
//       500: errors[500] ?? defaultErrorHandler,
//     };
//   }

//   exec(request: Request) {
//     const { search, pathname } = new URL(request.url);

//     const startTime = Date.now();

//     for (const route of Object.keys(this.routes)) {
//       const pattern = new URLPattern({ pathname: route });
//       const params = pattern.exec({ pathname })?.pathname.groups;

//       if (pattern.test({ pathname })) {
//         const routed = this.routes[route as PathString];

//         if (MethodRoutes.guard(routed)) {
//           const methodRoutes = routed;

//           for (const method of Object.keys(methodRoutes)) {
//             if (method === request.method) {
//               const routed = methodRoutes[method as Method] as
//                 | RouterHandler
//                 | ResponseObject;
//               return createWorkerHandler(routed, pathname, params);
//             }
//           }
//         } else {
//           return createWorkerHandler(routed, pathname, params);
//         }
//       }
//     }

//     console.log(
//       `${request.method} ${pathname + search} ${Date.now() - startTime}ms`,
//     );

//     throw new NotFound();
//   }
// }

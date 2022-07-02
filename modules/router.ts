import { ErrorStatus, Status } from "../deps.ts";
import { getKeys, getObject, PickOne } from "./types.ts";
import { Formatter, FormatterInit } from "./formatter.ts";
import { getHandlerArgs } from "../mod.ts";

import {
  Context,
  Handler,
  HandlerArgs,
  HandlerParams,
  RouterMethods,
} from "../mod.ts";
// import { Storage } from "./storage.ts";

class NotFound extends Error {}

type ResourceRoutes<
  C extends Context,
  Ps extends Path,
> = {
  [P in Ps]: Resource<C, P, ResourceValue>;
};

type ErrorRoutes<C extends Context> = {
  [E in ErrorStatus]?: ErrorImpl<C, E>;
};

export type Routes<C extends Context, Ps extends Path> =
  & ResourceRoutes<C, Ps>
  & ErrorRoutes<C>
  & {
    formatter?: FormatterInit;
  };

export class Router<C extends Context, Ps extends Path>
  implements RouterMethods<C> {
  private readonly routes: ResourceRoutes<C, Ps>;
  private readonly errors: ErrorRoutes<C>;
  private readonly formatter?: FormatterInit;

  constructor(routes: Routes<C, Ps>) {
    this.routes = routes;
    this.errors = routes;
    const { formatter } = routes;
    this.formatter = formatter;
  }

  route(request: Request): Handler<C> {
    const { search, pathname } = new URL(request.url);
    const path = pathname as Path;

    const startTime = Date.now();

    for (const route of getKeys(this.routes)) {
      const pattern = new URLPattern({ pathname: route });

      if (pattern.test({ pathname })) {
        const params = pattern.exec({ pathname })?.pathname
          .groups as PathParams<Ps>;

        const value = this.routes[route];

        if (this.isMethodRoutes(value)) {
          if (!isMethod(request.method)) continue;

          const impl = value[request.method];

          if (impl !== undefined) {
            return this.evaluateResourceImpl(impl, path as Ps, params);
          }
        } else {
          return this.evaluateResourceImpl(value, path as Ps, params);
        }
      }
    }

    console.log(
      `${request.method} ${pathname + search} ${Date.now() - startTime}ms`,
    );

    if (this.errors[404]) {
      return this.evaluateErrorImpl(this.errors[404], 404, path);
    } else {
      throw new NotFound();
    }
  }

  private evaluateResourceImpl<
    P extends Ps,
  >(
    impl: ResourceImpl<C, P, RouteReturnType>,
    path: P,
    params: PathParams<P> | undefined,
  ): Handler<C> {
    const errorImpl = this.errors[500];

    return this.isRouteHandler(impl)
      ? async (...args: HandlerParams<C>) => {
        const record = getHandlerArgs(args);
        try {
          const like = getResponseLike(
            path,
            await impl({ ...record, path, params }),
          );
          return this.formatResponseLike(like);
        } catch (error) {
          if (errorImpl !== undefined) {
            const handler = this.evaluateErrorImpl(
              errorImpl,
              500,
              path,
              params,
              error,
            );
            return handler(...args);
          } else {
            throw error;
          }
        }
      }
      : async (..._args: Parameters<Handler<C>>) => {
        const like = getResponseLike(path, impl);
        const response = this.formatResponseLike(like);
        return await Promise.resolve(response);
      };
  }

  private evaluateErrorImpl<P extends Path, E extends ErrorStatus>(
    impl: ErrorImpl<C, E>,
    status: E,
    path?: P,
    params?: PathParams<P>,
    error?: Error,
  ): Handler<C> {
    return this.isErrorHandler(impl)
      ? async (...args: HandlerParams<C>) => {
        const record = getHandlerArgs(args);
        const like = getResponseLike(
          500,
          await impl({
            ...record,
            status,
            path,
            params: params,
            error,
          }),
        );
        return this.formatResponseLike(like);
      }
      : async (..._args: Parameters<Handler<C>>) => {
        const like = getResponseLike(status, impl);
        const response = this.formatResponseLike(like);
        return await Promise.resolve(response);
      };
  }

  private formatResponseLike<R extends RouteReturnType>(
    like: ResponseLike<R>,
  ): Response {
    const formatter = new Formatter(this.formatter);
    return formatter.format(like);
  }

  private isMethodRoutes<
    P extends Ps,
    V extends ResourceValue,
  >(
    resource: Resource<C, P, V>,
  ): resource is MethodRoutes<C, P, V> | MethodRoutes<C, P, V[]> {
    return typeof resource === "object" && resource !== null &&
      Object.keys(resource).every(isMethod);
  }

  private isRouteHandler<
    P extends Path,
    R extends RouteReturnType,
  >(
    impl: ResourceImpl<C, P, R>,
  ): impl is RouteHandler<C, P, R> {
    return typeof impl === "function";
  }

  private isErrorHandler<E extends ErrorStatus>(
    impl: ErrorImpl<C, E>,
  ): impl is ErrorHandler<C, E, ErrorReturnType> {
    return typeof impl === "function";
  }
}

function getResponseLike<
  P extends Path | Status,
  R extends RouteReturnType,
>(
  route: P,
  value: R | ResponseLike<R>,
): ResponseLike<R> {
  if (isResponseLike(value)) return value;

  const status = typeof route === "string" ? 200 : route;

  return getObject([
    [status, value],
  ]);
}

export type Path = `/${string}`;

type PathKey<PathItem extends string> = PathItem extends `:${infer Key}` ? Key
  : never;

type PathKeys<PathString extends string> = PathString extends
  `${infer PathItem}/${infer Others}` ? PathKey<PathItem> | PathKeys<Others>
  : PathKey<PathString>;

type PathParams<PathString extends string> = PathKeys<PathString> extends never
  ? BasePathParams
  : { [key in PathKeys<PathString>]: string };

type BasePathParams = Record<string, string | undefined>;

// type ItemIdentifier = `/:${string}`;

// type CollectionPath<P extends Path, R extends RouteReturnType> = P extends
//   `${infer S extends Path}${ItemIdentifier}` ? S
//   : R extends ResourceValue[] ? P
//   : (P extends `${infer C extends Path}${ItemIdentifier}` ? C : never);

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof methods[number];

function isMethod(str: string): str is Method {
  return methods.some((method) => method == str);
}

type Resource<C extends Context, P extends Path, V extends ResourceValue> =
  | Collection<C, P, V>
  | Item<C, P, V>;

type Collection<C extends Context, P extends Path, V extends ResourceValue> =
  | MethodRoutes<C, P, V[]>
  // & Routes<C>
  | ResourceImpl<C, P, V[]>;

type Item<C extends Context, P extends Path, V extends ResourceValue> =
  | MethodRoutes<C, P, V>
  // & Routes<C>
  | ResourceImpl<C, P, V>;

type MethodRoutes<
  C extends Context,
  P extends Path,
  R extends RouteReturnType,
> =
  & {
    GET: ResourceImpl<C, P, R>;
  }
  & {
    [M in Exclude<Method, "GET">]?: ResourceImpl<C, P, RouteReturnType>;
  };

type ResourceImpl<
  C extends Context,
  P extends Path,
  R extends RouteReturnType,
> =
  | RouteHandler<C, P, R>
  | ResponseLike<R>
  | R;

type ErrorImpl<C extends Context, E extends ErrorStatus> =
  | ErrorHandler<
    C,
    E,
    ErrorReturnType
  >
  | ResponseLike<RouteReturnType>
  | ErrorReturnType;

type RouteHandler<
  C extends Context,
  P extends Path,
  R extends RouteReturnType,
> = (
  args: HandlerArgs<C> & {
    path: P;
    params?: PathParams<P>;
    // storage: Storage<C>;
    error?: Error;
  },
) => R | Promise<R> | ResponseLike<R> | Promise<ResponseLike<R>>;

export type RouteReturnType = ResourceValue | ResourceValue[];

type ErrorHandler<
  C extends Context,
  E extends ErrorStatus,
  R extends ErrorReturnType,
> = (
  args: HandlerArgs<C> & {
    status: E;
    path?: Path;
    params?: PathParams<Path>;
    error?: Error;
    // storage: Storage<C>;
  },
) => R | Promise<R> | ResponseLike<R> | Promise<ResponseLike<R>>;

type ErrorReturnType = string | Record<string, unknown>;

type Primitive = string | number | boolean | null;

export type ResourceValue =
  | Record<string, unknown>
  | Primitive
  | Primitive[];

export type ResponseLike<R extends RouteReturnType> =
  & PickOne<
    {
      [code in Status]: R;
    }
  >
  & ResponseInit;

function isResponseLike<R extends RouteReturnType>(
  value: R | ResponseLike<R>,
): value is ResponseLike<R> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === 1 &&
    Object.values(Status).some((status) => status == keys[0]);
}

/*
function isResourceImpl<C extends Context, T extends ResourceValue>(
  resource: Resource<C, T>,
): resource is ResourceImpl<C, T> | ResourceImpl<C, T> {
  return !isMethodRoutes(resource);
}

function isResourceValue<T extends ResourceValue>(
  impl: ResourceImpl<Context, T>,
): impl is RouteReturnType {
  return typeof impl !== "function";
}

function isPrimitive(value: RouteReturnType) {
  return value === null || typeof value === "string" ||
    typeof value === "number" || typeof value === "boolean";
}
*/

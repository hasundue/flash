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

type ResourceRoutes<C extends Context> = {
  [path: Path]: Resource<C, ResourceValue>;
};

type ErrorRoutes<C extends Context> = {
  [code in ErrorStatus]?: ResourceImpl<C, ResourceValue>;
};

export type Routes<C extends Context> = ResourceRoutes<C> & ErrorRoutes<C> & {
  formatter: FormatterInit;
};

export class Router<C extends Context> implements RouterMethods<C> {
  private readonly routes: ResourceRoutes<C>;
  private readonly errors: ErrorRoutes<C>;
  private readonly formatter: FormatterInit;

  constructor(routes: Routes<C>) {
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
      const params = pattern.exec({ pathname })?.pathname.groups;

      if (pattern.test({ pathname })) {
        const value = this.routes[route];

        if (isMethodRoutes(value)) {
          if (!isMethod(request.method)) continue;

          const impl = value[request.method];
          if (impl !== undefined) {
            return this.evaluateImpl(route, impl, path, params ?? {});
          }
        } else {
          return this.evaluateImpl(route, value, path, params ?? {});
        }
      }
    }

    console.log(
      `${request.method} ${pathname + search} ${Date.now() - startTime}ms`,
    );

    if (this.errors[404]) {
      return this.evaluateImpl(404, this.errors[404], path, {});
    } else {
      throw new NotFound();
    }
  }

  private evaluateImpl<S extends keyof Routes<C>, R extends RouteReturnType>(
    route: S,
    impl: ResourceImpl<C, R>,
    path: Path,
    params: PathParams,
  ): Handler<C> {
    const errorImpl = this.errors[500];

    return isRouteHandler(impl)
      ? async (...args: HandlerParams<C>) => {
        const record = getHandlerArgs(args);
        try {
          const like = getResponseLike<C, S, R>(
            route,
            await impl({ ...record, path, params }),
          );
          return this.formatResponseLike(like);
        } catch (error) {
          if (errorImpl !== undefined) {
            const like = isRouteHandler(errorImpl)
              ? getResponseLike<C, 500, RouteReturnType>(
                500,
                await errorImpl({ ...record, path, params, error }),
              )
              : getResponseLike<C, 500, RouteReturnType>(500, errorImpl);
            return this.formatResponseLike(like);
          } else {
            throw error;
          }
        }
      }
      : async (..._args: Parameters<Handler<C>>) => {
        const like = getResponseLike<C, S, R>(route, impl);
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
}

function getResponseLike<
  C extends Context,
  S extends keyof Routes<C>,
  R extends RouteReturnType,
>(
  route: S,
  value: R | ResponseLike<R>,
): ResponseLike<R> {
  if (isResponseLike(value)) return value;

  const status = typeof route === "string" ? 200 : route;

  return getObject([
    [status, value],
  ]);
}

type Path = `/${string}`;
type PathParams = Record<string, string>;

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof methods[number];

function isMethod(str: string): str is Method {
  return methods.some((method) => method == str);
}

type Resource<C extends Context, V extends ResourceValue> =
  | Collection<C, V>
  | Item<C, V>;

type Collection<C extends Context, V extends ResourceValue> =
  | MethodRoutes<C, V[]>
  // & Routes<C>
  | ResourceImpl<C, V[]>;

type Item<C extends Context, V extends ResourceValue> =
  | MethodRoutes<C, V>
  // & Routes<C>
  | ResourceImpl<C, V>;

type MethodRoutes<C extends Context, R extends RouteReturnType> =
  & {
    GET: ResourceImpl<C, R>;
  }
  & {
    [M in Exclude<Method, "GET">]?: ResourceImpl<C, R>;
  };

type ResourceImpl<C extends Context, R extends RouteReturnType> =
  | RouteHandler<C, R>
  | ResponseLike<R>
  | R;

type RouteHandler<C extends Context, R extends RouteReturnType> = (
  args: HandlerArgs<C> & {
    path: Path;
    params: PathParams;
    // storage: Storage<C>;
    error?: Error;
  },
) => R | Promise<R> | ResponseLike<R> | Promise<ResponseLike<R>>;

export type RouteReturnType = ResourceValue | ResourceValue[];

function isMethodRoutes<C extends Context, V extends ResourceValue>(
  resource: Resource<C, V>,
): resource is MethodRoutes<C, V> | MethodRoutes<C, V[]> {
  return typeof resource === "object" && resource !== null &&
    Object.keys(resource).every(isMethod);
}

function isRouteHandler<C extends Context, R extends RouteReturnType>(
  impl: ResourceImpl<C, R>,
): impl is RouteHandler<C, R> {
  return typeof impl === "function";
}

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

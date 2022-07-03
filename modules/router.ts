import { ErrorStatus, Status } from "../deps.ts";
import { getKeys, getObject } from "./types.ts";
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

type ResourceRoutes<C extends Context, Ps extends Path> = Readonly<
  {
    [P in Ps]: Resource<C, P, Status, EntityType>;
  }
>;

type ErrorRoutes<C extends Context> = Readonly<
  {
    [E in ErrorStatus]?: ErrorImpl<C, E>;
  }
>;

export type Routes<C extends Context, Ps extends Path> = Readonly<
  & ResourceRoutes<C, Ps>
  & ErrorRoutes<C>
  & {
    formatter?: FormatterInit;
  }
>;

export class Router<C extends Context, Ps extends Path>
  implements RouterMethods<C> {
  private routes: ResourceRoutes<C, Ps>;
  private errors: ErrorRoutes<C>;
  private formatter?: FormatterInit;

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
    impl: ResourceImpl<C, P, Status, ResourceType>,
    path: P,
    params: PathParams<P> | undefined,
  ): Handler<C> {
    const errorImpl = this.errors[500];

    return this.isRouteHandler(impl)
      ? async (...args: HandlerParams<C>) => {
        const record = getHandlerArgs(args);
        try {
          const value = await impl({ ...record, path, params });
          return isResponseLike(value)
            ? this.formatResponseLike(value)
            : this.formatResponseLike(getResponseLike(200, value));
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
        const response = isResponseLike(impl)
          ? this.formatResponseLike(impl)
          : this.formatResponseLike(getResponseLike(200, impl));
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
        const value = await impl({ ...record, status, path, params, error });
        return isResponseLike(value)
          ? this.formatResponseLike(value)
          : this.formatResponseLike(getResponseLike(status, value));
      }
      : async (..._args: Parameters<Handler<C>>) => {
        const like = isResponseLike(impl)
          ? impl
          : getResponseLike(status, impl);
        const response = this.formatResponseLike(like);
        return await Promise.resolve(response);
      };
  }

  private formatResponseLike<S extends Status, R extends ReturnType>(
    like: ResponseLike<S, R>,
  ): Response {
    const formatter = new Formatter(this.formatter);
    return formatter.format(like);
  }

  private isMethodRoutes<
    P extends Ps,
    S extends Status,
    V extends EntityType,
  >(
    resource: Resource<C, P, S, V>,
  ): resource is MethodRoutes<C, P, S, V> | MethodRoutes<C, P, S, V[]> {
    return typeof resource === "object" && resource !== null &&
      Object.keys(resource).every(isMethod);
  }

  private isRouteHandler<
    P extends Path,
    S extends Status,
    R extends ResourceType,
  >(
    impl: ResourceImpl<C, P, S, R>,
  ): impl is RouteHandler<C, P, S, R> {
    return typeof impl === "function";
  }

  private isErrorHandler<E extends ErrorStatus, R extends ErrorType>(
    impl: ErrorImpl<C, E>,
  ): impl is ErrorHandler<C, E, R> {
    return typeof impl === "function";
  }
}

function getResponseLike<
  S extends Status,
  R extends ReturnType,
>(
  status: S,
  value: R,
): ResponseLike<S, R> {
  return getObject([[status, value]]);
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

type Resource<
  C extends Context,
  P extends Path,
  S extends Status,
  V extends EntityType,
> =
  | Collection<C, P, S, V>
  | Entity<C, P, S, V>;

type Collection<
  C extends Context,
  P extends Path,
  S extends Status,
  V extends EntityType,
> =
  | MethodRoutes<C, P, S, V[]>
  // & Routes<C>
  | ResourceImpl<C, P, S, V[]>;

type Entity<
  C extends Context,
  P extends Path,
  S extends Status,
  V extends EntityType,
> =
  | MethodRoutes<C, P, S, V>
  // & Routes<C>
  | ResourceImpl<C, P, S, V>;

type MethodRoutes<
  C extends Context,
  P extends Path,
  S extends Status,
  R extends ResourceType,
> = Readonly<
  & {
    GET: ResourceImpl<C, P, S, R>;
  }
  & {
    [M in Exclude<Method, "GET">]?: ResourceImpl<C, P, Status, ResourceType>;
  }
>;

type ResourceImpl<
  C extends Context,
  P extends Path,
  S extends Status,
  R extends ResourceType,
> =
  | RouteHandler<C, P, S, R>
  // | ResponseLike<S, R>
  | R;

type ErrorImpl<C extends Context, E extends ErrorStatus> =
  | ErrorHandler<
    C,
    E,
    ErrorType
  >
  | ResponseLike<E, ErrorType>
  | ErrorType;

type RouteHandler<
  C extends Context,
  P extends Path,
  S extends Status,
  R extends ResourceType,
> = (
  args: HandlerArgs<C> & {
    path: P;
    params?: PathParams<P>;
    // storage: Storage<C>;
    error?: Error;
  },
) =>
  | R
  | Promise<R>
  | ResponseLike<S, R>
  | Promise<ResponseLike<S, R>>;

export type ResourceType = EntityType | EntityType[];

type ErrorHandler<
  C extends Context,
  E extends ErrorStatus,
  R extends ErrorType,
> = (
  args: HandlerArgs<C> & {
    status: E;
    path: Path | undefined;
    params: PathParams<Path> | undefined;
    error: Error | undefined;
    // storage: Storage<C>;
  },
) => R | Promise<R> | ResponseLike<E, R> | Promise<ResponseLike<E, R>>;

type ErrorType = string | Readonly<Record<string, unknown>>;

export type ReturnType = ErrorType | ResourceType;

type Primitive = string | number | boolean | null;

export type EntityType =
  | Readonly<Record<string, unknown>>
  | Primitive
  | Primitive[];

export type ResponseLike<S extends Status, R extends ReturnType> =
  & {
    [code in S]: R;
  }
  & ResponseInit;

function isResponseLike<S extends Status, R extends ReturnType>(
  value: R | ResponseLike<S, R>,
): value is ResponseLike<S, R> {
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

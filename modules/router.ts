import { ErrorStatus, Status, SuccessStatus } from "../deps.ts";
import { getKeys, getObject } from "./types.ts";
import { Formatter, FormatterInit } from "./formatter.ts";
import { getHandlerArgs, isWorkerHandlerArgs } from "../mod.ts";

import {
  Context,
  Handler,
  HandlerArgs,
  HandlerParams,
  RouterMethods,
} from "../mod.ts";
import { Storage } from "./storage.ts";

class NotFound extends Error {}

export type RouteKey = Path | 404 | 500 | "format";

// deno-fmt-ignore
export type Routes<C extends Context, Ks extends RouteKey> =
  {
    // TODO: infer specific types of Status, EntityType, and ErrorType
    [K in Ks]: K extends Path
      ? Resource<C, K, SuccessStatus, EntityType>
      : K extends 404 | 500
        ? ErrorImpl<C, Path, K, ErrorType>
        : FormatterInit;
  }

export class Router<
  C extends Context,
  Ks extends RouteKey,
  Ps extends Ks & Path,
> implements RouterMethods<C> {
  private routes: Routes<C, Ks>;
  private formatter?: FormatterInit;

  constructor(routes: Routes<C, Ks>) {
    this.routes = routes;

    // @ts-ignore we accept routes.format to be undefined
    const format: FormatterInit | undefined = routes.format;

    this.formatter = format;
  }

  route<
    P extends Ps,
    S extends SuccessStatus,
    T extends EntityType,
  >(request: Request): Handler<C> {
    const startTime = Date.now();

    const { origin, pathname, search } = new URL(request.url);
    const path = pathname as Path;
    const routes = getKeys(this.routes).filter(this.isPath);

    for (const route of routes) {
      const pattern = new URLPattern({ pathname: route });

      if (pattern.test({ pathname })) {
        const params = pattern.exec({ pathname })?.pathname
          .groups as PathParams<Ps>;

        const resource = this.routes[route] as Resource<C, P, S, T>;

        if (this.isMethodRoutes(resource)) {
          if (!isMethod(request.method)) continue;

          const impl = resource[request.method];

          if (impl !== undefined) {
            // @ts-ignore TODO: fix PathParams
            return this.evaluateRouteImpl(impl, origin, path as P, params);
          }
        } else {
          // @ts-ignore TODO: fix PathParams
          return this.evaluateRouteImpl(resource, origin, path as P, params);
        }
      }
    }

    console.log(
      `${request.method} ${pathname + search} ${Date.now() - startTime}ms`,
    );

    const maybe404 = getKeys(this.routes).filter(this.isNotFoundStatus)[0];
    const maybeNotFoundImpl = this.routes[maybe404];

    if (maybeNotFoundImpl) {
      return this.evaluateErrorImpl(
        maybeNotFoundImpl,
        404,
        path,
        {} as PathParams<Path>,
      );
    }

    throw new NotFound();
  }

  private isPath(key: Ks): key is Ps {
    return typeof key === "string" && key.match(/\/\S*/) !== null;
  }

  private isNotFoundStatus(key: Ks): key is Ks & 404 {
    return key == 404;
  }

  private isErrorStatus(key: Ks): key is Ks & 500 {
    return key == 500;
  }

  private evaluateRouteImpl<
    P extends Ps,
    S extends SuccessStatus,
    T extends EntityType,
  >(
    impl:
      | ResourceImpl<C, P, S, T, T>
      | ResourceImpl<C, P, S, T, T[]>
      | OperationImpl<C, P, S, T, ResultType>,
    origin: string,
    path: P,
    params: PathParams<P>,
  ): Handler<C> {
    const maybe500 = getKeys(this.routes).filter(this.isErrorStatus)[0];
    const maybeErrorImpl = this.routes[maybe500];

    return this.isRouteHandler(impl)
      ? async (...args: HandlerParams<C>) => {
        const record = getHandlerArgs(args);

        const storagePath = getStoragePath(path);

        const storage = isWorkerHandlerArgs(record)
          ? new Storage<T>(record.env, origin, storagePath)
          : {} as Storage<T>;

        try {
          const value = await impl({ ...record, storage, path, params });
          return isResponseLike(value)
            ? this.formatResponseLike(value)
            : this.formatResponseLike(getResponseLike(200, value));
        } catch (error) {
          if (error instanceof Error && maybeErrorImpl !== undefined) {
            const handler = this.evaluateErrorImpl(
              maybeErrorImpl,
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

  private evaluateErrorImpl<
    E extends ErrorStatus,
    T extends ErrorType,
    P extends Path,
  >(
    impl: ErrorImpl<C, P, E, T>,
    status: E,
    path: P,
    params: PathParams<P>,
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

  private formatResponseLike<S extends Status, R extends ResponseType>(
    like: ResponseLike<S, R>,
  ): Response {
    const formatter = new Formatter(this.formatter);
    return formatter.format(like);
  }

  private isMethodRoutes<
    P extends Ps,
    S extends SuccessStatus,
    T extends EntityType,
  >(
    resource: Resource<C, P, S, T>,
  ): resource is MethodRoutes<C, P, S, T, T> | MethodRoutes<C, P, S, T, T[]> {
    return typeof resource === "object" && resource !== null &&
      Object.keys(resource).every(isMethod);
  }

  private isRouteHandler<
    P extends Path,
    S extends SuccessStatus,
    T extends EntityType,
  >(
    impl:
      | ResourceImpl<C, P, S, T, T>
      | ResourceImpl<C, P, S, T, T[]>
      | OperationImpl<C, P, S, T, ResultType>,
  ): impl is
    | ResourceHandler<C, P, S, T, T>
    | ResourceHandler<C, P, S, T, T[]>
    | OperationHandler<C, P, S, T, ResultType> {
    return typeof impl === "function";
  }

  private isErrorHandler<
    E extends ErrorStatus,
    P extends Path,
    T extends ErrorType,
  >(
    impl: ErrorImpl<C, P, E, T>,
  ): impl is ErrorHandler<C, P, E, T> {
    return typeof impl === "function";
  }
}

function getResponseLike<
  S extends Status,
  R extends ResponseType,
>(
  status: S,
  value: R,
): ResponseLike<S, R> {
  return getObject([[status, value]]) as ResponseLike<S, R>;
}

export type Path = `/${string}` | "*";

type Parent<P extends Path> = ParentDir<P> extends `${infer S extends Path}/`
  ? S
  : never;

type ParentDir<P extends string> = P extends `${infer Head}/${infer Tail}`
  ? `${Head}/${ParentDir<Tail>}`
  : "";

// deno-fmt-ignore
type PathKey<PathItem extends string> = PathItem extends `:${infer Key}`
  ? Key
  : never;

// deno-fmt-ignore
type PathKeys<PathString extends string> =
  PathString extends `${infer PathItem}/${infer Others}`
    ? PathKey<PathItem> | PathKeys<Others>
    : PathKey<PathString>;

type PathParams<PathString extends string> = PathKeys<PathString> extends never
  ? BasePathParams
  : { [key in PathKeys<PathString>]: string };

type BasePathParams = Record<string, string | undefined>;

export function parentOf<P extends Path>(path: P): Parent<P> {
  const match = path.match(/(\/\S+)?(\/\S*$)/);

  if (!match || match.length !== 3 || !match[2]) {
    throw new Error(`Unable to parse a path: ${path}.`);
  }

  if (match[1]) {
    return match[1] as Parent<P>;
  } else {
    return "/" as Parent<P>;
  }
}

export function getStoragePath<P extends Path>(
  path: P,
): P | Parent<P> {
  // @ts-ignore path can be "/"
  if (path === "/") return "/" as P;

  // @ts-ignore parentOf(path) can be "/"
  if (parentOf(path) === "/") return path as P;

  return parentOf(path) as Parent<P>;
}

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof methods[number];

function isMethod(str: string): str is Method {
  return methods.some((method) => method == str);
}

type Resource<
  C extends Context,
  P extends Path,
  S extends SuccessStatus,
  T extends EntityType,
> =
  | Collection<C, P, S, T>
  | Entity<C, P, S, T>;

type Collection<
  C extends Context,
  P extends Path,
  S extends SuccessStatus,
  T extends EntityType,
> =
  | MethodRoutes<C, P, S, T, T[]>
  // & Routes<C>
  | ResourceImpl<C, P, S, T, T[]>;

type Entity<
  C extends Context,
  P extends Path,
  S extends SuccessStatus,
  T extends EntityType,
> =
  | MethodRoutes<C, P, S, T, T>
  // & Routes<C>
  | ResourceImpl<C, P, S, T, T>;

type MethodRoutes<
  C extends Context,
  P extends Path,
  S extends SuccessStatus,
  T extends EntityType,
  R extends ResourceType,
> =
  & {
    GET?: ResourceImpl<C, P, S, T, R>;
  }
  & {
    [M in Exclude<Method, "GET">]?: OperationImpl<
      C,
      P,
      S,
      T,
      ResultType
    >;
  };

type ResourceImpl<
  C extends Context,
  P extends Path,
  S extends SuccessStatus,
  T extends EntityType,
  R extends ResourceType,
> =
  | ResourceHandler<C, P, S, T, R>
  | ResponseLike<S, R>
  | R;

type OperationImpl<
  C extends Context,
  P extends Path,
  S extends SuccessStatus,
  T extends EntityType,
  R extends ResultType,
> =
  | OperationHandler<C, P, S, T, R>
  | ResponseLike<S, R>
  | R;

type ErrorImpl<
  C extends Context,
  P extends Path,
  E extends ErrorStatus,
  T extends ErrorType,
> =
  | ErrorHandler<C, P, E, T>
  | ResponseLike<E, T>
  | T;

type ResourceHandler<
  C extends Context,
  P extends Path,
  S extends SuccessStatus,
  T extends EntityType,
  R extends ResourceType,
> = (
  args: HandlerArgs<C> & {
    path: P;
    params: PathParams<P>;
    storage: Storage<T>;
  },
) =>
  | RouteReturnType<S, R>
  | RouteReturnType<ErrorStatus, ErrorType>;

type OperationHandler<
  C extends Context,
  P extends Path,
  S extends SuccessStatus,
  T extends EntityType,
  R extends ResultType,
> = (
  args: HandlerArgs<C> & {
    path: P;
    params: PathParams<P>;
    storage: Storage<T>;
  },
) =>
  | RouteReturnType<S, R>
  | RouteReturnType<ErrorStatus, ErrorType>;

type RouteReturnType<S extends Status, R extends ResponseType> =
  | R
  | Promise<R>
  | ResponseLike<S, R>
  | Promise<ResponseLike<S, R>>;

type ErrorHandler<
  C extends Context,
  P extends Path,
  E extends ErrorStatus,
  T extends ErrorType,
> = (
  args: HandlerArgs<C> & {
    status: E;
    path: P;
    params: PathParams<P>;
    error: Error | undefined;
  },
) => RouteReturnType<E, T>;

export type EntityType =
  | Record<string, unknown>
  | Primitive
  | Primitive[];

export type ResourceType = EntityType | EntityType[];

type ErrorType =
  | Record<string, unknown>
  | string
  | null;

type ResultType =
  | Record<string, unknown>
  | string
  | null;

export type ResponseType = ErrorType | ResourceType | ResultType;

type Primitive =
  | string
  | number
  | boolean
  | null;

export type ResponseLike<S extends Status, R extends ResponseType> =
  & {
    [code in S]?: R;
  }
  & ResponseInit;

function isResponseLike<S extends Status, R extends ResponseType>(
  value: R | ResponseLike<S, R>,
): value is ResponseLike<S, R> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const keys = Object.keys(value);
  return keys.length === 1 &&
    Object.values(Status).some((status) => status == keys[0]);
}

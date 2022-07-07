import { ErrorStatus, Status, SuccessStatus } from "../deps.ts";
import { getKeys, getObject } from "./types.ts";
import { Formatter, FormatterInit } from "./formatter.ts";
import {
  DurableObject,
  getHandlerArgs,
  isWorkerHandlerArgs,
  Worker,
} from "../mod.ts";

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
export type Routes<C extends Context, Ks extends RouteKey> = Readonly<
  {
    // TODO: infer specific types of Status, EntityType, and ErrorType
    [K in Ks]: K extends Path
      ? K extends "/"
        ? Resource<C, K, Status, EntityType>
        : Parent<K> extends "/"
          ? Collection<C, K, Status, EntityType>
          : Parent<Parent<K>> extends "/"
            ? Entity<C, K, Status, EntityType>
            : Resource<C, K, Status, EntityType>
      : K extends 404 | 500
        ? ErrorImpl<C, Path, K, ErrorType>
        : FormatterInit;
  }
>;

// deno-fmt-ignore
type RoutesHelper<
  C extends Context,
  Ks extends RouteKey,
  Rs extends {
    [P in Ks & Path]: ConcreteResource<C, P>
  },
> = {
    [K in Ks]: K extends Path
      ? Rs[K] extends (infer R extends Rs[K]) ? R : never
      : K extends 404 | 500
        ? ErrorImpl<C, Path, K, ErrorType>
        : FormatterInit;
};

type ConcreteResource<C extends Context, P extends Path> = {
  [S in SuccessStatus]:
    | Resource<C, P, S, string>
    | Resource<C, P, S, number>
    | Resource<C, P, S, Record<string, unknown>>;
}[SuccessStatus];

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
    S extends Status,
    T extends EntityType,
  >(request: Request): Handler<C> {
    const { host, pathname, search } = new URL(request.url);
    const path = pathname as Path;

    const startTime = Date.now();

    const routes = getKeys(this.routes).filter(this.isPath);

    for (const route of routes) {
      const pattern = new URLPattern({ pathname: route });

      if (pattern.test({ pathname })) {
        const params = pattern.exec({ pathname })?.pathname
          .groups as PathParams<Ps>;

        const resource = this.routes[route] as Resource<C, P, S, T>;

        if (this.isMethodRoutes(resource)) {
          if (!isMethod(request.method)) continue;

          const impl = resource[request.method] as
            | ResourceImpl<C, P, P, S, T, T[]>
            | ResourceImpl<C, P, Parent<P>, S, T, T>;

          if (impl !== undefined) {
            return this.evaluateResourceImpl(
              impl,
              host,
              routes,
              path as P,
              params,
            );
          }
        } else {
          return this.evaluateResourceImpl(
            resource as
              | ResourceImpl<C, P, P, S, T, T[]>
              | ResourceImpl<C, P, Parent<P>, S, T, T>,
            host,
            routes,
            path as P,
            params,
          );
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

  private evaluateResourceImpl<
    P extends Ps,
    S extends Status,
    T extends EntityType,
  >(
    impl:
      | ResourceImpl<C, P, P, S, T, T[]>
      | ResourceImpl<C, P, Parent<P>, S, T, T>,
    host: string,
    routes: Ps[],
    path: P,
    params: PathParams<P> | BasePathParams,
  ): Handler<C> {
    const maybe500 = getKeys(this.routes).filter(this.isErrorStatus)[0];
    const maybeErrorImpl = this.routes[maybe500];

    return this.isRouteHandler(impl)
      ? async (...args: HandlerParams<C>) => {
        const record = getHandlerArgs(args);

        const storagePath = getStoragePath(routes, path);

        const storage = isWorkerHandlerArgs(record)
          ? new Storage<Worker, Q, T>(record.env, host, storagePath)
          : {} as Storage<DurableObject, Q, T>;

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
    S extends Status,
    T extends EntityType,
  >(
    resource: Resource<C, P, S, T>,
  ): resource is
    | MethodRoutes<C, P, P, S, T, T[]>
    | MethodRoutes<C, P, Parent<P>, S, T, T> {
    return typeof resource === "object" && resource !== null &&
      Object.keys(resource).every(isMethod);
  }

  private isRouteHandler<
    P extends Path,
    S extends Status,
    T extends EntityType,
  >(
    impl:
      | ResourceImpl<C, P, P, S, T, T[]>
      | ResourceImpl<C, P, Parent<P>, S, T, T>,
  ): impl is
    | RouteHandler<C, P, P, S, T, T[]>
    | ResourceImpl<C, P, Parent<P>, S, T, T> {
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
  return getObject([[status, value]]);
}

export type Path = `/${string}`;

type Parent<P extends Path> = ParentDir<P> extends `${infer S extends Path}/`
  ? S
  : "/";

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

export function getStoragePath<P extends Path, Q extends P | Parent<P>>(
  path: P,
): Q {
  return path as Q;
}

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof methods[number];

function isMethod(str: string): str is Method {
  return methods.some((method) => method == str);
}

type Resource<
  C extends Context,
  P extends Path,
  S extends Status,
  T extends EntityType,
> =
  | Collection<C, P, S, T>
  | Entity<C, P, S, T>;

type Collection<
  C extends Context,
  P extends Path,
  S extends Status,
  T extends EntityType,
> =
  | MethodRoutes<C, P, P, S, T, T[]>
  // & Routes<C>
  | ResourceImpl<C, P, P, S, T, T[]>;

type Entity<
  C extends Context,
  P extends Path,
  S extends Status,
  T extends EntityType,
> =
  | MethodRoutes<C, P, Parent<P>, S, T, T>
  // & Routes<C>
  | ResourceImpl<C, P, Parent<P>, S, T, T>;

type MethodRoutes<
  C extends Context,
  P extends Path,
  Q extends Path,
  S extends Status,
  T extends EntityType,
  R extends ResourceType,
> = Readonly<
  & {
    GET: ResourceImpl<C, P, Q, S, T, R>;
  }
  & {
    [M in Exclude<Method, "GET">]?: ResourceImpl<
      C,
      P,
      Q,
      Status,
      T,
      ResourceType
    >;
  }
>;

type ResourceImpl<
  C extends Context,
  P extends Path,
  Q extends Path,
  S extends Status,
  T extends EntityType,
  R extends ResourceType,
> =
  | RouteHandler<C, P, Q, S, T, R>
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

type RouteHandler<
  C extends Context,
  P extends Path,
  Q extends Path,
  S extends Status,
  T extends EntityType,
  R extends ResourceType,
> =
  | ((args: RouteHandlerArgs<C, P, Q, T>) => R)
  | ((args: RouteHandlerArgs<C, P, Q, T>) => Promise<R>)
  | ((args: RouteHandlerArgs<C, P, Q, T>) => ResponseLike<S, R>)
  | ((args: RouteHandlerArgs<C, P, Q, T>) => Promise<ResponseLike<S, R>>);

type RouteHandlerArgs<
  C extends Context,
  P extends Path,
  Q extends Path,
  T extends EntityType,
> = HandlerArgs<C> & {
  path: P;
  params: PathParams<P>;
  storage: Storage<C, Q, T>;
};

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
    // storage: Storage<C>;
  },
) => T | Promise<T> | ResponseLike<E, T> | Promise<ResponseLike<E, T>>;

export type ResourceType = EntityType | EntityType[];

export type EntityType =
  | Record<string, unknown>
  | Primitive
  | Primitive[];

type ErrorType =
  | string
  | Record<string, unknown>
  | null;

export type ResponseType = ErrorType | ResourceType;

type Primitive =
  | string
  | number;
// | boolean;
// | null;

// TODO: Add Readonly to this
export type ResponseLike<S extends Status, R extends ResponseType> =
  & {
    [code in S]: R;
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

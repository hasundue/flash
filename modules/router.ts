import { ErrorStatus } from "../deps.ts";
import { getKeys, getObject, PickAny } from "./types.ts";

import { Context, HandlerArgs, HandlerLike } from "../mod.ts";
import { ResponseLike } from "./response.ts";

export type Routes<C extends Context> =
  & {
    [path: PathString]: RouteValue<C>;
  }
  & {
    [code in ErrorStatus]?: Exclude<RouteValue<C>, MethodRoutes<C>>;
  };

export class Router<C extends Context> {
  private readonly routes: Omit<Routes<C>, ErrorStatus>;
  private readonly errors: Omit<Routes<C>, PathString>;

  constructor(routes: Routes<C>) {
    this.routes = routes;
    this.errors = routes;
  }

  call(request: Request) {
    const { search, pathname } = new URL(request.url);

    const startTime = Date.now();

    for (const route of getKeys(this.routes)) {
      const pattern = new URLPattern({ pathname: route });
      const params = pattern.exec({ pathname })?.pathname.groups;

      if (pattern.test({ pathname })) {
        const value = this.routes[route];

        if (MethodRoutes.guard(value)) {
          for (const method of getKeys(value)) {
            if (method === request.method) {
              const result = value[method] as ResponseLike | RouteHandler<C>;
              return this.castHandler<C>(
                result,
                pathname as PathString,
                params,
              );
            }
          }
        } else {
          return this.castHandler(value, pathname as PathString, params);
        }
      }
    }

    console.log(
      `${request.method} ${pathname + search} ${Date.now() - startTime}ms`,
    );

    if (this.errors[404]) {
      return this.castHandler(
        this.errors[404],
        pathname as PathString,
        {},
        404,
      );
    } else {
      throw Error("Route Not Found");
    }
  }

  private castHandler<C extends Context>(
    value: Exclude<RouteValue<C>, MethodRoutes<C>>,
    pathname: PathString,
    params: PathParams | undefined,
    key?: keyof Routes<C>,
  ): ReturnType<Router<C>> {
    return RouteHandler.guard(value)
      ? async (args) =>
        getResponseLike<C>(
          key,
          await value({ ...args, path: pathname, params: params ?? {} }),
        )
      : getResponseLike<C>(key, value);
  }
}

export interface Router<C extends Context> {
  (request: Request): HandlerLike<C> | ResponseLike;
}

function getResponseLike<C extends Context>(
  key: keyof Routes<C> | undefined,
  value: string | Record<string, unknown> | ResponseLike,
): ResponseLike {
  if (typeof value !== "string" && ResponseLike.guard(value)) return value;

  return getObject([
    [key ?? 200, value],
  ]);
}

type PathString = `/${string}`;
type PathParams = Record<string, string>;

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof methods[number];

export const Method = {
  guard(str: string | number | symbol): str is Method {
    return methods.some((method) => method === str);
  },
};

type RouteValue<C extends Context> =
  | MethodRoutes<C>
  | RouteHandler<C>
  | ResponseLike
  | Record<string, unknown>
  | string;

type MethodRoutes<C extends Context> = PickAny<
  {
    [M in Method]: RouteHandler<C> | ResponseLike | Response;
  }
>;

const MethodRoutes = {
  guard<C extends Context>(
    value: RouteValue<C>,
  ): value is MethodRoutes<C> {
    return typeof value !== "function" && typeof value !== "string" &&
      !(value instanceof Response) &&
      getKeys(value).every(Method.guard);
  },
};

type RouteHandler<C extends Context> = (
  args: HandlerArgs<C> & {
    path: PathString;
    params: PathParams;
    error?: Error;
  },
) => RouteHandlerReturnType<C> | Promise<RouteHandlerReturnType<C>>;

type RouteHandlerReturnType<C extends Context> = Exclude<
  RouteValue<C>,
  MethodRoutes<C> | RouteHandler<C>
>;

const RouteHandler = {
  guard<C extends Context>(
    value: RouteValue<C>,
  ): value is RouteHandler<C> {
    return typeof value === "function";
  },
};

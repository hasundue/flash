import { ErrorStatus } from "../deps.ts";
import type { Arguments } from "./types.ts";
import { getKeys, PickAny } from "./types.ts";

import { Context, Handler, RouterInterface } from "../mod.ts";
import { ResponseLike } from "./response.ts";

export type Routes<C extends Context> =
  & {
    [path: PathString]: RouteValue<C>;
  }
  & {
    [code in ErrorStatus]?: Exclude<RouteValue<C>, MethodRoutes<C>>;
  };

export class Router<C extends Context> implements RouterInterface<C> {
  readonly routes: Omit<Routes<C>, ErrorStatus>;
  readonly errors: Omit<Routes<C>, PathString>;

  constructor(routes: Routes<C>) {
    this.routes = routes;
    this.errors = routes;
  }

  exec(request: Request) {
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
              return castHandler<C>(result, pathname as PathString, params);
            }
          }
        } else {
          return castHandler(value, pathname as PathString, params);
        }
      }
    }

    console.log(
      `${request.method} ${pathname + search} ${Date.now() - startTime}ms`,
    );

    if (this.errors[404]) {
      return castHandler(this.errors[404], pathname as PathString);
    } else {
      throw Error("Route Not Found");
    }
  }
}

function castHandler<C extends Context>(
  value: RouteHandler<C> | ResponseLike,
  pathname: PathString,
  params?: PathParams,
): ReturnType<RouterInterface<C>["exec"]> {
  return RouteHandler.guard(value)
    ? (...args: Arguments<Handler<C>>) =>
      value({ ...args, path: pathname, params: params ?? {} })
    : value;
}

type PathString = `/${string}`;
type PathParams = Record<string, string>;

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;
type Method = typeof methods[number];

export const Method = {
  guard(str: string): str is Method {
    return methods.some((method) => method === str);
  },
};

type RouteValue<C extends Context> =
  | MethodRoutes<C>
  | RouteHandler<C>
  | ResponseLike;

type MethodRoutes<C extends Context> = PickAny<
  {
    [M in Method]: RouteHandler<C> | ResponseLike | Response;
  }
>;

const MethodRoutes = {
  guard<C extends Context>(
    value: RouteValue<C>,
  ): value is MethodRoutes<C> {
    return typeof value !== "function" && !(value instanceof Response) &&
      getKeys(value).every(Method.guard);
  },
};

type RouteHandler<C extends Context> = (
  args: Arguments<Handler<C>> & { params: PathParams; path: PathString },
) => ResponseLike;

const RouteHandler = {
  guard<C extends Context>(
    value: RouteValue<C>,
  ): value is RouteHandler<C> {
    return typeof value === "function";
  },
};

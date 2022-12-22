export type RestApiSpecs = RestApiObject;

// type WorkerArguments = {
//   request: Request;
//   env: Record<string, string>;
//   context: Record<string, unknown>;
// };

type RestApiObject = Record<string, Resource<any>>;

// type EndpointFunction<E> = <T extends any>(
//   args: EndpointArguments<E, T>,
// ) => EndpointObject;

// type EndpointArguments<E, T> = {
//   params: E;
//   storage: ResourceStorage<T>;
// };

export type Resource<T> = (args: {
  storage: ResourceStorage<T>;
}) => ResourceObject<T>;

interface ResourceStorage<T> {
  count: () => Promise<number>;
  list: () => Promise<T[]>;
  get: (key: string | number) => Promise<T>;
  put: (key: string | number, value: T) => Promise<void>;
}

type Path = `/${string}`;

type ResourceObject<T> =
  & {
    GET?: ResourceQuery<T, any>;
    PUT?: ResourceMutation;
    POST?: ResourceMutation;
  }
  & {
    [P in Path]: ResourceQuery<T, any>;
  };

type ResourceQuery<T, Ps> = (
  params: Ps,
) => T | Promise<T> | T[] | Promise<T[]>;

type ResourceMutation = (
  params: any,
) => void | Promise<void>;

type;

export class Flash {
  rest = (worker: RestApiSpecs) => {
    return worker;
  };
}

export const flash = new Flash();

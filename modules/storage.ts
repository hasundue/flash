import { fetch, WorkerEnv } from "../mod.ts";
import { EntityType, Path } from "./router.ts";
import * as DurableObject from "../modules/durable_object.ts";

export class Storage<
  T extends EntityType,
> {
  private env: WorkerEnv;
  private host: string;
  private path: Path;

  constructor(env: WorkerEnv, host: string, path: Path) {
    this.env = env;
    this.host = host;
    this.path = path;
  }

  async list(): Promise<T[]> {
    const request = new Request(this.host + this.path, {
      method: "GET",
    });
    const response = await DurableObject.fetch(
      this.env.storage,
      this.path,
      request,
    );
    const collection: T[] = await response.json();
    return collection;
  }

  async get(key: string): Promise<T | undefined> {
    const request = new Request(this.host + this.path, {
      method: "GET",
      body: JSON.stringify({ key }),
    });
    const response = await DurableObject.fetch(
      this.env.storage,
      this.path,
      request,
    );
    if (response.status !== 200) {
      const body: { stack: string } = await response.json();
      throw Error(body.stack);
    }
    const entity: T | undefined = await response.json();
    return entity;
  }

  async put(key: string, entity: T): Promise<void> {
    const request = new Request(this.host + this.path, {
      method: "PUT",
      body: JSON.stringify({ key, entity }),
    });
    const response = await DurableObject.fetch(
      this.env.storage,
      this.path,
      request,
    );
    if (response.status !== 200) {
      const body: { stack: string } = await response.json();
      throw Error(body.stack);
    }
  }
}

export class WorkerStorage implements DurableObject.Stub {
  private readonly state: DurableObject.State;

  constructor(state: DurableObject.State) {
    this.state = state;
  }

  fetch = fetch({
    "/": {
      GET: async ({ request }) => {
        let body: { key: string | null };

        try {
          body = await request.json();
        } catch (error) {
          return { 400: error.stack };
        }

        try {
          if (body.key) { // storage.get()
            const entity = await this.state.storage.get(body.key);
            return entity as EntityType ?? null;
          } else { // storage.list()
            const map = await this.state.storage.list();
            return Array.from(Object.values(map)) as EntityType[];
          }
        } catch (error) {
          return { 500: error.stack };
        }
      },

      PUT: async ({ request }) => {
        let body: { key: string; entity: DurableObject.StorageValue };

        try {
          body = await request.json();
        } catch (error) {
          return { 400: error.stack as string };
        }

        try {
          await this.state.storage.put(body.key, body.entity);
          return { 200: null };
        } catch (error) {
          return { 500: error.stack as string };
        }
      },
    },
  });
}

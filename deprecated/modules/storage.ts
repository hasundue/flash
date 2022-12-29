import { fetcher, WorkerEnv } from "../mod.ts";
import { EntityType, Path } from "./router.ts";
import * as DurableObject from "../modules/durable_object.ts";

export class Storage<
  T extends EntityType,
> {
  private env: WorkerEnv;
  private origin: string;
  private path: Path;

  constructor(env: WorkerEnv, origin: string, path: Path) {
    this.env = env;
    this.origin = origin;
    this.path = path;
  }

  async list(): Promise<T[]> {
    const request = new Request(this.origin + "/list", {
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
    const request = new Request(this.origin + "/get", {
      method: "POST",
      body: JSON.stringify({ key }),
    });
    const response = await DurableObject.fetch(
      this.env.storage,
      this.path,
      request,
    );
    if (response.status != 200) {
      const error: Error = await response.json();
      throw error;
    }
    const entity: T | undefined = await response.json();
    return entity;
  }

  async put(key: string, entity: T): Promise<void> {
    const request = new Request(this.origin + "/put", {
      method: "PUT",
      body: JSON.stringify({ key, entity }),
    });
    const response = await DurableObject.fetch(
      this.env.storage,
      this.path,
      request,
    );
    if (response.status != 200) {
      const error: Error = await response.json();
      throw error;
    }
  }
}

export class WorkerStorage {
  private readonly state: DurableObject.State;

  constructor(state: DurableObject.State) {
    this.state = state;
  }

  fetch = fetcher({
    "/list": {
      GET: async () => {
        try {
          const map = await this.state.storage.list();
          return Array.from(Object.values(map)) as EntityType[];
        } catch (error) {
          return { 500: error as Error };
        }
      },
    },

    "/get": {
      POST: async ({ request }) => {
        let body: { key: string };

        try {
          body = await request.json();
        } catch (error) {
          return { 400: error as Error };
        }

        try {
          const entity = await this.state.storage.get(body.key);
          return entity as EntityType ?? null;
        } catch (error) {
          return { 500: error as Error };
        }
      },
    },

    "/put": {
      PUT: async ({ request }) => {
        let body: { key: string; entity: DurableObject.StorageValue };

        try {
          body = await request.json();
        } catch (error) {
          return { 400: error as Error };
        }

        try {
          await this.state.storage.put(body.key, body.entity);
          return { 200: null };
        } catch (error) {
          return { 500: error as Error };
        }
      },
    },
  });
}

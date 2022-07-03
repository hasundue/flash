import { fetcher, flare } from "../mod.ts";
import * as DurableObject from "../modules/durable_object.ts";

declare module "../mod.ts" {
  interface WorkerEnv {
    readonly do: DurableObject.Namespace;
  }
}

export default flare({
  "/": {
    // [200 OK] { message: "Welcome to flash!" }
    GET: { 200: "Welcome to flash!" },
  },

  "/users": {
    GET: async ({ request, env }) => {
      const response = await DurableObject.fetch(env.do, "/users", request);
      return await response.json();
    },

    POST: async ({ request, env }) => {
      const response = await DurableObject.fetch(env.do, "/users", request);
      const body = await response.json();
      return response.status == 201 ? { 201: body } : { 400: body };
    },
  },
  "/users/:name": {
    GET: async ({ request, env, params }) => {
      const response = await DurableObject.fetch(env.do, "/users", request);
      const body = await response.json();
      return response.status == 200 ? body : { 404: body };
    },
  },
  // [404 Not Found] { message: "URL not exist" }
  // 404: { message: "Requested URL or method is not available." },
  // [500 Internal Server Error] { message: "Unexpected error.", stack: "..." }
  // 500: () => ({ message: "Unexpected error." }),

  // formatter: { error: { message: true } },
});

export class MyDurableObject implements DurableObject.Stub {
  private readonly state: DurableObject.State;

  constructor(state: DurableObject.State) {
    this.state = state;
  }

  fetch = fetcher({
    "/users": {
      GET: async () => await this.state.storage.list(),

      POST: async ({ request }) => {
        let body;

        try {
          body = await request.json();
        } catch {
          return { 400: "Request body missing." };
        }

        if (!body.name) return { 400: "Field 'name' missing." };

        const { name }: { name: string } = body;
        const value = { name, awesome: true };

        await this.state.storage.put(name, value);

        return { 201: value };
      },
    },

    "/users/:name": {
      GET: async ({ params }) => {
        const value = await this.state.storage.get(params.name);
        return value ?? { 404: `User '${params.name}' not found.` };
      },
    },

    404: { message: "Requested URL or method is not available." },

    500: ({ error }) => ({ message: "Unexpected error.", stack: error?.stack }),

    formatter: { error: { message: true } },
  });
}

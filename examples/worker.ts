import { fetcher, flare } from "../mod.ts";
import * as DurableObject from "../modules/durable_object.ts";
import { parse } from "https://pax.deno.dev/thenoakes/deno-body-parser/mod.ts";

declare module "../mod.ts" {
  interface WorkerEnv {
    readonly do: DurableObject.Namespace;
  }
}

export default flare({
  "/": {
    // [200 OK] { message: "Welcome to flash!" }
    GET: "Welcome to flash!",
  },

  "/users": {
    GET: async ({ request, env }) => {
      return await DurableObject.fetch(env.do, "/users", request);
    },

    POST: async ({ request, env }) => {
      return await DurableObject.fetch(env.do, "/users", request);
    },
  },

  "/users/:name": {
    GET: async ({ request, env }) => {
      return await DurableObject.fetch(env.do, "/users", request);
    },
  },

  // [404 Not Found] { message: "URL not exist" }
  404: { message: "Requested URL or method is not available." },

  // [500 Internal Server Error] { message: "Unexpected error.", stack: "..." }
  500: ({ error }) => ({ message: "Unexpected error.", stack: error?.stack }),

  format: { error: { message: true } },
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
        const body = await parse(request);

        if (!body) return { 400: "Request body missing." };
        if (!body.data?.name) return { 400: "Field 'name' missing." };

        const { name }: { name: string } = body.data;
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

    format: { error: { message: true } },
  });
}

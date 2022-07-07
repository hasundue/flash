import { fetcher, flare } from "../mod.ts";
import * as DurableObject from "../modules/durable_object.ts";

declare module "../mod.ts" {
  interface WorkerEnv {
    readonly do: DurableObject.Namespace;
  }
}

export default flare({
  "/": {
    GET: { 200: "Welcome to flash!" },
  },
  "/users": {
    GET: async ({ request, env }) => {
      const response = await DurableObject.fetch(env.do, "/users", request);
      const json: { name: string }[] = await response.json();
      return json;
    },
    POST: async ({ request, env }) => {
      const response = await DurableObject.fetch(env.do, "/users", request);
      const body = await response.json();
      return response.status == 201 ? { 201: body } : { 400: body };
    },
  },
  "/users/:name": {
    GET: async ({ request, env }) => {
      const response = await DurableObject.fetch(env.do, "/users", request);
      const body = await response.json();
      return response.status == 200 ? body : { 404: body };
    },
  },
  404: { message: "Requested URL or method is not available." },

  500: ({ error }: { error?: Error }) => ({
    message: "Unexpected error.",
    stack: error?.stack,
  }),
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

    500: ({ error }: { error?: Error }) => ({
      message: "Unexpected error.",
      stack: error?.stack,
    }),
  });
}

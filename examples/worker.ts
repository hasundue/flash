import { flare } from "../mod.ts";

export { WorkerStorage } from "../mod.ts";

export default flare({
  "/": {
    GET: { 200: "Welcome to flash!" },
  },
  "/users": {
    GET: async ({ storage }) => {
      return await storage.list();
    },
    POST: async ({ request, storage }) => {
      let body: { name: string };

      try {
        body = await request.json();
      } catch {
        return { 400: "Invalid request body." };
      }

      try {
        await storage.put(body.name, body);
      } catch (error) {
        return { 500: error as string };
      }

      return { 201: body };
    },
  },
  "/users/:name": {
    GET: async ({ params, storage }) => {
      const entity = await storage.get(params.name);
      return entity ?? { 404: params.name + " not found." };
    },
  },
  404: { message: "Requested URL or method is not available." },

  500: ({ error }: { error?: Error }) => ({
    message: "Unexpected error.",
    stack: error?.stack,
  }),
});

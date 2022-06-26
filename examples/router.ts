import { rest } from "../mod.ts";

export default rest({
  "/": {
    // [200 OK] { message: "Welcome to flash!" }
    GET: "Welcome to flash!",
  },

  "/resources": {
    POST: ({ request }) => {
      const resource = createResouce(request.body);

      // [500 Internal Server Error] { message: "Failed in creating a new resource." }
      if (!resource) return { 500: "Failed in creating a new resource." };

      // [201 Created] { name: "flash", foo: 1, bar: 2 }
      return { 201: resource };
    },
  },

  "/resources/:name": {
    GET: ({ params }) => {
      const resource = findResource(params.name);

      // [404 Not Found] { message: "'deno' not exist." }
      if (!resource) return { 404: `${params.name} not exist` };

      // [200 OK] { name: "flare", foo: 1, bar: 2 }
      return resource;
    },
  },

  // [404 Not Found] { message: "URL not exist" }
  404: ({ message: "URL not exist." }),

  // [500 Internal Server Error] { message: "Unexpected error occured.", stack: "..." }
  500: ({ error }) => ({
    message: "Unexpected error occured.",
    stack: error.stack,
  }),
});

// deno-lint-ignore no-explicit-any
const createResouce = (_obj: any) => ({ name: "flash", foo: 1, bar: 2 });
const findResource = (name: string) => ({ name, foo: 1, bar: 2 });

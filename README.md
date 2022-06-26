# flash

Flash is a framework to build REST APIs with [Deno](https://deno.land/) and
[Cloudflare Workers](https://www.cloudflare.com/products/workers-kv/)
([Denoflare](https://denoflare.dev/))

> :warning: Do not use Flash for production use yet, unless you are a
> contributor to the framework.

## Usage

Create a worker module file:

```typescript
// index.ts
import { rest } from "https://deno.land/x/flash/mod.ts";

export default rest({
  "/": {
    // [200 OK] "Welcome to flash!"
    GET: "Welcome to flash!",
  },

  "/resources": {
    POST: async ({ request }) => {
      const resource = await createResouce(request.body);

      // [500 Internal Server Error] { message: "Failed in creating a resource." }
      if (!resource) return { 500: "Failed in creating a resource." };

      // [201 Created] { name: "flash", foo: 1, bar: 2 }
      return { 201: resource };
    },
  },

  "/resources/:name": {
    GET: async ({ params }) => {
      const resource = await findResource(params.name);

      // [404 Not Found] { message: "'deno' was not found." }
      if (!resource) return { 404: `'${params.name}' was not found.` };

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
```

And run with Denoflare!

```sh
$ denoflare serve index.ts
```

## Acknowledgment

Development of Flash is supported by
[Active Connector Inc.](https://active-connector.com).

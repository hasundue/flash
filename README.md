# flash

Flash is a framework to build REST APIs with [Denoflare](https://denoflare.dev/)
([Deno](https://deno.land/) and
[Cloudflare Workers](https://www.cloudflare.com/products/workers-kv/)).

> :warning: Do not use Flash for production use yet, unless you are a
> contributor to the framework.

## Usage (blueprint)

Create a worker module file:

```typescript
// index.ts
import { NotFound, rest } from "https://deno.land/x/flash/mod.ts";

export default rest({
  "/": {
    // [200 OK] "Welcome to flash!"
    GET: "Welcome to flash!",
  },

  "/find/:name": {
    GET: async ({ params }) => {
      const resource = await findResource(params.name);

      // [404 Not Found] { message: "'deno' was not found." }
      if (!resource) throw new NotFound(`'${params.name}' was not found.`);

      // [200 OK] { name: "flare", foo: 1, bar: 2 }
      return resource;
    },
  },

  "/create": {
    POST: async ({ request }) => {
      const resource = await createResouce(request.body);

      // [500 Internal Server Error] { message: "Failed in creating a resource." }
      if (!resource) throw new Error("Failed in creating a resource.");

      // [201 Created] { name: "flash", foo: 1, bar: 2 }
      return { 201: resource };
    },
  },
});
```

And run with Denoflare!

```sh
$ denoflare serve index.ts
```

## Acknowledgment

Development of Flash is supported by
[Active Connector Inc.](https://active-connector.com).

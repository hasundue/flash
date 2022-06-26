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

  "/users": {
    POST: async ({ request }) => {
      const user = await createUser(request.body);

      // [500 Internal Server Error] { message: "Failed in creating a user." }
      if (!user) return { 500: { message: "Failed in creating a user." } };

      // [201 Created] { name: "flash", foo: 1, bar: 2 }
      return { 201: user };
    },
  },

  "/users/:name": {
    GET: async ({ params }) => {
      const user = await getUser(params.name);

      // [404 Not Found] { message: "User 'deno' was not found." }
      if (!user) return { 404: { message: `User '${params.name}' was not found.` } };

      // [200 OK] { name: "flare", foo: 1, bar: 2 }
      return user;
    },
  },

  // [404 Not Found] { message: "The requested URL was not found." }
  404: { message: "The requested URL was not found." },

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

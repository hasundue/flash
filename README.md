# flash

Flash is a framework to build REST APIs efficiently with
[Denoflare](https://denoflare.dev/) ([Deno](https://deno.land/) +
[Cloudflare Workers](https://www.cloudflare.com/products/workers-kv/)).

> :warning: Do not use Flash for production use yet, unless you are a
> contributor to the framework.

## Usage

Create a worker module file:

```typescript
// index.ts
import { flash } from "https://deno.land/x/flash/mod.ts";

export default flash({
  "/": "Welcome to flash!",
  // => { message: "Welcome to flash!", status: 200 }

  "/echo/:name": {
    GET: ({ params }) => `${params.name}`,
  },

  "/create": {
    POST: async ({ request }) => {
      const something = await create_something(request.body);
      return {
        message: "Created something in a flash!",
        result: something,
        status: 201,
      };
    },
  },

  404: "404: Not found", // => { message: "Not found", status: 404 }
});
```

And run with Denoflare!

```sh
$ denoflare serve index.ts
```

## Acknowledgment

Development of Flash is supported by
[Active Connector Inc.](https://active-connector.com).

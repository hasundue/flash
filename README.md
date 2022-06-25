# flash

Flash is a framework to build REST APIs efficiently with
[Denoflare](https://denoflare.dev/) ([Deno](https://deno.land/) +
[Cloudflare Workers](https://www.cloudflare.com/products/workers-kv/)).

> :warning: Do not use Flash for production use yet, unless you are a
> contributor of the framework.

## Usage

Create a worker module file:

```typescript
// index.ts
import { flash } from "https://deno.land/x/flash/mod.ts";

export default flash({
  "/": ({ request }) => {
    const country = request.cf.country;
    return { message: `Welcome from ${country}!` };
  },

  "/echo/:name": {
    GET: ({ params }) => {
      return { name: params.name };
    },
  },

  404: { message: "Not found", status: 404 },
});
```

And run with Denoflare!

```sh
denoflare serve index.ts
```

## Acknowledgment

Development of Flash is supported by
[Active Connector Inc.](https://active-connector.com).

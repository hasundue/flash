# flash

Flash is a framework to build cloud service APIs with
[Denoflare](https://denoflare.dev/).

For now it only supports REST API.

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

Development of **flash** is supported by
[Active Connector Inc.](https://active-connector.com).

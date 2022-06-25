# flash

Flash is a framework to build cloud service APIs with
[Denoflare](https://denoflare.dev/).

## Usage

Create a worker module file:

```typescript
// index.ts
import { flash } from "https://deno.land/x/flash/mod.ts";

export default flash({
  "/": { message: "Hello Flash!" },

  "/create": {
    POST: () => {
      // Do something here
      return { message: "Created", status: 201 };
    },
  },

  "/object/:name": {
    GET: ({ params }) => ({ name: params.name }),
  },

  404: { message: "Not Found", status: 404 },
});
```

And run with Denoflare!

```sh
denoflare serve index.ts
```

## Acknowledgment

Development of **flash** is supported by
[Active Connector Inc.](https://active-connector.com).

# flash

Flash is a progressive web framework in TypeScript, particularly optimized for building REST APIs on serverless platforms with Deno.

> :warning: Do not use Flash for production use yet, unless you are a
> contributor to the framework.

## Key Features

- **Multi Environment**
  - Runtime
    - Deno
    - Node.js (coming soon...)
  - Platform
    - [Cloudflare Workers](https://www.cloudflare.com/products/workers-kv/)
    - Deno Deploy (coming soon...)

- **Declarative interface**

## Usage

### Cloudflare Workers

Create a worker module file:

```typescript
// index.ts
import { flare } from "https://deno.land/x/flash/mod.ts";

export default flare({ "/": "Welcome to flash!" });
```

And deploy with [Denoflare](https://denoflare.dev/)!

```sh
$ denoflare push index.ts --name flash-demo
```

## Features

Coming soon...

## Acknowledgment

Development of Flash is supported by
[Active Connector Inc.](https://active-connector.com).

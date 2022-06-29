# flash

Flash is a progressive web framework in TypeScript, particularly optimized for
building REST APIs on serverless platforms with Deno.

> :warning: Do not use Flash for production use yet, unless you are a
> contributor to the framework.

## Philosophy

Flash is designed to be...

- ⚡ ***Efficient*** - frees you from what you don't have to
- 💓 ***Flexible*** - lets you do what you want
- 🚫 ***Strict*** - prohibits you from doing what you shouldn't

Yes, they are conflicting. But why not try best to achieve all?

## Features/Roadmap

- [ ] 💻 **Multi Environment**
  - Runtime
    - [x] Deno
    - [ ] Node.js
  - Platform
    - [x] [Cloudflare Workers](https://www.cloudflare.com/products/workers-kv/)
    - [ ] Deno Deploy (coming soon...)
- And more...

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

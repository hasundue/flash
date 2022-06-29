# flash

Flash is a progressive web framework in TypeScript, particularly optimized for
building REST APIs on serverless platforms with Deno.

> :warning: Do not use Flash for production use yet, unless you are a
> contributor to the framework.

## Philosophy

Flash is designed to be...

- ⚡ ***Efficient*** - frees you from what you don't have to do
- 💓 ***Flexible*** - lets you do what you want to
- 🚫 ***Strict*** - prohibits you from doing what you shouldn't

Yes, they are conflicting. But why not try best to achieve all?

## Features/Roadmap

- [ ] 💻 **Multi Environment**
  - Runtime
    - [x] Deno
    - [ ] Node.js
  - Platform
    - [x] [Cloudflare Workers](https://www.cloudflare.com/products/workers-kv/)
    - [ ] Deno Deploy
- [x] 🚀 **Progressive API**
  - [x] Unified interface for the router and error handlers written in a tree structure
  - [x] Polymorphism in handler definition
  - [x] Syntax sugar for responses
  - [x] Smart and customizable response formatter
- [ ] 🔧 **Full support of Cloudflare Workers**
  - [ ] Out-of-box middleweres built on Durable Objects
     - [ ] Object storage associated with each resource URL
     - [ ] Blocking communication among workers
- [ ] 📕 **Code/Doc Generation**
  - [ ] Universal Typescript SDK for clients
  - [ ] OpenAPI specs
  - [ ] Seamless hosting of API documents

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

## Functionalities

### Routing by URLPattern and methods

```typescript
export default flare({
  "/": "Welcome to flash!", // for all methods
  "/users/:name": {
    GET: ({ params }) => params.name
  },
}
```

### And more...

## Acknowledgment

Development of Flash is supported by
[Active Connector Inc.](https://active-connector.com).

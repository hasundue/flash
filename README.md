# flash

Flash is a progressive web framework in TypeScript, particularly optimized for
building REST APIs on serverless platforms with Deno.

> **warning** Do not use Flash for production use yet, unless you are a
> contributor to the framework.

## Philosophy

Flash is designed to be...

- ⚡ _**Efficient**_ - frees you from what you don't have to do
- 💓 _**Flexible**_ - lets you do what you want
- 🚫 _**Strict**_ - prohibits you from doing what you should not

Yes, they are conflicting. But why not try best to achieve all?

## Features/Roadmap

- [ ] 💻 **Multi Environment**
  - Runtime
    - [x] Deno
    - [ ] Node.js
  - Platform
    - [x] [Cloudflare Workers](https://www.cloudflare.com/products/workers-kv/)
    - [ ] Deno Deploy
  - Bundler/Emulator
    - [ ] Wrangler2
    - [x] Denoflare
- [x] 🚀 **Progressive API**
  - [x] Declarative interface for routers with a tree structure
  - [x] Error handlers integrated in routers
  - [x] Polymorphism in handler definitions
  - [x] Syntax sugar for responses
  - [x] Smart and customizable response formatter
- [ ] ⛅ **Out-of-box middlewares for Cloudflare Workers**
  - [ ] Object storage associated with each resource URL
  - [ ] Blocking communication among workers
- [ ] 📜 **Code/Doc Generation**
  - [ ] Universal Typescript SDK for clients
  - [ ] OpenAPI specs
  - [ ] Seamless hosting of API documents
- [ ] ✨ **Zero third-party dependencies**

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

## APIs

### Routing by URLPattern and methods

```typescript
export default flare({
  "/": "Welcome to flash!", // for all methods
  "/users/:name": {
    GET: ({ params }) => params.name,
  },
}
```

### And more...

## Acknowledgment

Development of Flash is supported by
[Active Connector Inc.](https://active-connector.com).

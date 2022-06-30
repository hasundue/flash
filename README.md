# flash

Flash is a progressive web framework in TypeScript, particularly optimized for
building REST APIs on serverless platforms with Deno.

> **Warning**\
> Do not use Flash for production use yet, unless you are a contributor to the
> framework.

## Philosophy

Flash is designed to be...

- :zap: _**Efficient**_ - frees you from what you don't have to do
- :magic_wand: _**Flexible**_ - lets you achive what you want
- :rotating_light: _**Strict**_ - prohibits you from doing what you shouldn't

Yes, they are conflicting. But why not try best to achieve all?

## Features/Roadmap

- [ ] :helicopter: **Multi Environment**
  - Runtime
    - [x] Deno
    - [ ] Node.js
  - Platform
    - [x] [Cloudflare Workers](https://workers.cloudflare.com/)
    - [ ] Deno Deploy
  - Bundler/Emulator
    - [ ] Wrangler2
    - [x] Denoflare
- [x] :rocket: **Progressive APIs**
  - [x] Declarative interface for routers with tree structures
  - [x] Error handlers integrated in routers
  - [x] Polymorphism in handler definitions
  - [x] Syntax sugar for responses
  - [x] Smart and customizable response formatter
- [ ] :sun_behind_large_cloud: **Out-of-box middlewares for Cloudflare Workers**
  - [ ] Object storage associated with each resource URL
  - [ ] Blocking communication among workers
- [ ] :scroll: **Code/Doc Generation**
  - [ ] Universal Typescript SDK for clients
  - [ ] OpenAPI specs
  - [ ] Seamless hosting of API documents
- [ ] :sparkles: **Zero third-party dependencies**

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

### Routers

Implemented with the standard
[URLPattern](https://developer.mozilla.org/en-US/docs/Web/API/URLPattern)
interface.

```typescript
flare({
  "/": "Welcome to flash!",
  "/users/:name": ({ params }) => params.name,
});
```

### Error Handlers

You can define error handlers within a router:

```typescript
flare({
  "/": "Welcome to flash!",
  404: "Not Found",
  500: "Unexpected Error",
});
```

### Request Handlers

You can access various utility objects provided by Flash in addition to standard
arguments of a platform:

```typescript
flare({
  "/": ({ request, env, context, params, errors, ...}) => ...
});
```

You can replace a handler with a value if you don't refer to any argument;

```typescript
flare({
  "/": () => "Hello",
});
```

can be rewritten as

```typescript
flare({
  "/": "Hello",
});
```

### Responses

You can use syntax sugar to create a response with a specified status. You can
omit it for a response with the OK status;

```typescript
flare({
  "/": "Hello",
});
```

```typescript
flare({
  "/": { 200: "Hello" },
});
```

are equivalent to:

```typescript
flare({
  "/": new Response("Hello", { status: 200 }),
});
```

### Formatters

You can add different formatters for each response status:

```typescript
flare({
  // [200] "Hello"
  "/": "Hello",

  // [400] "Not Found",
  404: "Not Found",

  // [500] { message: "Unexpected Error" }
  500: "Unexpected Error",

  format: {
    error: { message: true },
    400: { message: false },
  },
});
```

## Acknowledgment

Development of Flash is supported by
[Active Connector Inc.](https://active-connector.com).

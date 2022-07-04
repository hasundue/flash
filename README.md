# flash

Flash is a type-oriented web framework in TypeScript, particularly optimized for
building cloud microservices with a REST API on a serverless platforms with
Deno.

> **Warning**\
> Flash is still an alpha version. Do not use it for production use yet, unless
> you are a contributor to the framework.

## Concepts

- _Stay RESTful._
- _You implement, we type._

## Features / Roadmap

- [ ] :rocket: **Multi Platform**
  - [x] Cloudflare Workers
  - [ ] Deno Deploy
- [x] :magic_wand: **Progressive APIs**
  - [ ] Tree-structured and semantic routers
  - [x] Polymorphism in resource implementation
  - [x] Syntax sugar for responses
  - [ ] Strong type inference
- [ ] :sun_behind_small_cloud: **Out-of-box middlewares for Cloudflare Workers**
  - [ ] Object storage associated with each resource URL
  - [ ] Blocking communication among workers
- [ ] :scroll: **Code/Doc Generation**
  - [ ] Universal Typescript SDK for clients
  - [ ] OpenAPI specs
  - [ ] Seamless hosting of API documents
- [ ] :gear: **Advanced functionalities**
  - [ ] Multipart support
  - [ ] GraphQL server
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

## Examples

- [/examples/worker.ts](/examples/worker.ts): An example app for the integration test

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

You can define error handlers within a router.

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
omit it for a response with the OK status:

```typescript
flare({
  "/": { 200: "Hello" },
});
```

```typescript
flare({
  "/": "Hello",
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

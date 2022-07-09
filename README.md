# flash

Flash is a resource-oriented web framework in TypeScript, particularly optimized for
building RESTful APIs on serverless platforms with Deno.

> **Warning**\
> Flash is still an alpha version. Do not use it for production use yet, unless
> you are a contributor to the framework.

## Concepts

- _Stay RESTful._
- _You implement, we type._

## Roadmap

- [ ] :rocket: **Multi Platform**
  - [x] Cloudflare Workers ([Denoflare](https://denoflare.dev))
  - [ ] Deno Deploy
- [x] :magic_wand: **Progressive APIs**
  - [ ] Tree-structured router with a compile-time parser
  - [x] Polymorphism in resource implementation
  - [x] Syntax sugar for responses
- [x] :sun_behind_small_cloud: **Middlewares for Cloudflare Workers**
  - [x] Built-in key-value stores associated with each resource collection
  - [ ] Blocking communication among workers
- [ ] :scroll: **Productivity**
  - [ ] Generate OpenAPI specs from implementation
  - [ ] Host documents seamlessly
- [ ] :gear: **Advanced functionalities**
  - [ ] Multipart support
  - [ ] GraphQL server

## Usage

### Cloudflare Workers

Create a worker module file:

```typescript
// index.ts
import { flare } from "https://deno.land/x/flash/mod.ts";

export default flare({ "/": "Welcome to flash!" });
```

And deploy with Denoflare!

```sh
$ denoflare push index.ts --name flash-demo
```

## Key Features

### Built-in key-value stores (Cloudflare Workers)

You can access built-in key-value stores associated with each resource
collection with zero configuration.

```typescript
flare({
  "/users": {
    GET: async ({ storage }) => {
      return await storage.list();
    },
  },
  "/users/:name": {
    PUT: async ({ request, params, storage }) => {
      await storage.put(params.name, await request.json());
      return { 201: params.name };
    },
  },
}
```

## Examples

- [/examples/worker.ts](/examples/worker.ts): An example app for the integration
  test

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

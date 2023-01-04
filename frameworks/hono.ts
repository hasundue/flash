import { Hono } from "https://deno.land/x/hono@v2.1.4/mod.ts";
import { Application } from "../core/application.ts";

export function build(specs: Application) {
  const app = new Hono();

  return app;
}

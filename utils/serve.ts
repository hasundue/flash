import { Hono } from "https://deno.land/x/hono@v2.4.1/mod.ts";
import { Application } from "../types/application.ts";

const instantiate = (app: Application) => {
  const router = new Hono();
};

export const serve = (app: Application) => {
};

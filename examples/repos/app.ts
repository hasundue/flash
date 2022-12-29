import { Application } from "../../mod.ts";
import { Hono } from "../../backends/hono.ts";
import { D1, Workers } from "../../platforms/cloudflare.ts";
import { repos } from "./repos.ts";

export const app: Application = {
  backend: Hono(),
  platform: Workers(),
  storage: D1(),
  resources: {
    repos: { impl: repos, datum: "repo" },
  },
};

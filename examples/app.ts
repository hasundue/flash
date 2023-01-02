import { Application } from "../core/application.ts";
import { UpstashRedis } from "../platforms/upstash.ts";
import { repository } from "./resources/repository.ts";

const redis = new UpstashRedis({
  url: Deno.env.get("REDIS_URL")!,
  token: Deno.env.get("REDIS_TOKEN")!,
});

export const app: Application = {
  resources: [
    {
      name: "repository",
      alias: { singular: "repo", plural: "repos" },
      main: repository,
      storage: redis,
    },
  ],
};

import { env } from "../utils/env.ts";
import { Application } from "../mod.ts";
import { Redis } from "../platforms/upstash.ts";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const app: Application = {
  resources: [
    {
      alias: { singular: "repo", plural: "repos" },
      source: "./resources/repository.ts",
      storage: redis,
    },
  ],
};

export default app;

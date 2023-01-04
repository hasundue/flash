import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { load } from "https://deno.land/std@0.170.0/dotenv/mod.ts";
import { Redis } from "../platforms/upstash.ts";
import { build } from "../core/build.ts";

const env = await load();

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

export const app = await build({
  resources: [
    {
      name: "repository",
      alias: { singular: "repo", plural: "repos" },
      src: "./resources/repository.ts",
      storage: redis,
    },
  ],
});

// serve(app.fetch);

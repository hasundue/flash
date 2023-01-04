import { loadSync } from "https://deno.land/std@0.170.0/dotenv/mod.ts";
import { UpstashRedis } from "../platforms/upstash.ts";

const env = loadSync();

const redis = new UpstashRedis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

redis.test();

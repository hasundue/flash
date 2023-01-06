import { Redis } from "../platforms/upstash.ts";
import { env } from "../utils/env.ts";

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

redis.test();

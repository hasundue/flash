import { errors } from "https://deno.land/std@0.170.0/http/http_errors.ts";
import {
  Redis,
  RedisConfigDeno,
} from "https://deno.land/x/upstash_redis@v1.18.4/mod.ts";
import { Resource, ResourceSpecs, ResourceStorage } from "../types/resource.ts";
import { ResourceStorageFactory } from "../types/application.ts";
import { joinKeys } from "../utils/join_keys.ts";

export class RedisAdapter implements ResourceStorageFactory {
  protected redis: Redis;

  constructor(init: RedisConfigDeno) {
    this.redis = new Redis(init);
  }

  createResourceStorage<R extends ResourceSpecs>(
    _resource: Resource<R>,
    prefix: string,
  ): ResourceStorage<R["keys"], R["body"], R["meta"]> {
    return {
      get: async (keys) => {
        const key = joinKeys(keys, { prefix, seperator: "/" });
        const body = await this.redis.get<R["body"] & R["meta"]>(key);
        if (!body) {
          throw new errors.NotFound();
        }
        return { ...keys, ...body };
      },
      put: async (keys, body, meta) => {
        const key = joinKeys(keys, { prefix, seperator: "/" });
        const value = { ...body, ...meta };
        await this.redis.hmset(key, value);
      },
      list: async (query) => {
        const values = await this.redis.lrange();
      },
    };
  }
}

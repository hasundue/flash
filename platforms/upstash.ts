import { errors } from "https://deno.land/std@0.170.0/http/http_errors.ts";
import {
  Redis,
  RedisConfigDeno,
} from "https://deno.land/x/upstash_redis@v1.18.4/mod.ts";
import {
  AbstractResourceSpecs,
  Resource,
  ResourceStorage,
  ResourceValue,
} from "../types/resource.ts";
import { QueryOperatorRecord } from "../types/operators.ts";
import { ResourceStorageFactory } from "../types/application.ts";
import { joinKeys } from "../utils/join_keys.ts";

export class RedisAdapter implements ResourceStorageFactory {
  protected redis: Redis;
  protected operators: QueryOperatorRecord;

  constructor(init: RedisConfigDeno) {
    this.redis = new Redis(init);
    this.operators = {
      eq: (x) => {
        return { bool: true, value: "" };
      },
    };
  }

  createResourceStorage<R extends AbstractResourceSpecs>(
    _resource: Resource<R>,
    prefix: string,
  ): ResourceStorage<R> {
    return {
      get: async (keys) => {
        const key = joinKeys(keys, { prefix, seperator: "/" });
        const value = await this.redis.hgetall<ResourceValue<R>>(key);
        if (!value) {
          throw new errors.NotFound();
        }
        return { ...keys, ...value };
      },
      put: async (keys, value) => {
        const key = joinKeys(keys, { prefix, seperator: "/" });
        await this.redis.hset<ResourceValue<R>>(key, value);
      },
      list: async (query) => {
        const values = await this.redis.zadd();
      },
    };
  }
}

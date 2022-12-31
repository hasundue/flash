import { errors } from "https://deno.land/std@0.170.0/http/http_errors.ts";
import {
  Redis,
  RedisConfigDeno,
} from "https://deno.land/x/upstash_redis@v1.18.4/mod.ts";
import {
  AbstractResourceSpecs,
  ConcreteResourceStorage,
  Resource,
  ResourceValue,
} from "../types/resource.ts";
import { ConcreteQueryOperatorRecord, isQuantity } from "../types/operators.ts";
import { ResourceStorageFactory } from "../types/application.ts";
import { joinKeys } from "../utils/join_keys.ts";

const toScore = (x: unknown): number | undefined => {
  if (!isQuantity(x)) {
    return undefined;
  }
  if (x instanceof Date) {
    return x.valueOf();
  }
  return x;
};

type C = { root: string; field: string };
type T = Promise<number[]>;

export class UpstashRedis implements ResourceStorageFactory<C, T> {
  protected redis: Redis;

  protected operators: ConcreteQueryOperatorRecord<C, T>;

  constructor(init: RedisConfigDeno) {
    this.redis = new Redis(init);
    this.operators = {
      eq: (value) => async ({ root, field }) => {
        return await this.redis.get(`${root}:s:${field}:${value}`) ?? [];
      },
      // ne: (x) => (f) => "hoge",
      // lt: (x) => (f) => "hoge",
      // gt: (x) => (f) => "hoge",
      // and: (x) => (f) => "hoge",
      // or: (x) => (f) => "hoge",
    };
  }

  createResourceStorage<R extends AbstractResourceSpecs>(
    _resource: Resource<R>,
    root: string,
  ): ConcreteResourceStorage<R, C, T> {
    return {
      get: async (keys) => {
        const key = joinKeys(keys, { seperator: ":", prefix: root });
        const value = await this.redis.hgetall<ResourceValue<R>>(key);
        if (!value) {
          throw new errors.NotFound();
        }
        return { ...keys, ...value };
      },
      put: async (keys, value) => {
        const key = joinKeys(keys, { seperator: ":", prefix: root });
        const record = { ...keys, ...value };

        await this.redis.hset(key, value);

        for (const field in record) {
          const value = record[field];

          await this.redis.sadd(`${root}:s:${field}:${value}`, key);

          const score = toScore(value);
          if (score) {
            await this.redis.zadd(`${root}:z:${field}`, { score, member: key });
          }
        }
      },
      list: async (query) => {
        let keys: number[] = [];

        for (const field in query) {
          const condition = query[field];
          if (condition) {
            keys = keys.concat(await condition({ root, field }));
          }
        }
        const values = await this.redis.mget<ResourceValue<R>>(
          ...keys.toString(),
        );
      },
    };
  }
}

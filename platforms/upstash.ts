import { filterValues } from "https://deno.land/std@0.184.0/collections/filter_values.ts";
import { intersect } from "https://deno.land/std@0.184.0/collections/intersect.ts";
import { union } from "https://deno.land/std@0.184.0/collections/union.ts";
import { errors } from "https://deno.land/std@0.184.0/http/http_errors.ts";
import {
  Redis as RedisClient,
  RedisConfigDeno,
} from "https://deno.land/x/upstash_redis@v1.20.3/mod.ts";
import { AbstractResourceType, ResourceObject } from "../core/resource.ts";
import {
  ConcreteQueryOperatorRecord,
  isPrimitive,
  isQuantity,
  Quantity,
} from "../core/query.ts";
import { ConcreteResourceStorage, StorageAdapter } from "../core/storage.ts";
import { joinKeys } from "../utils/join_keys.ts";

const toScore = (x: Quantity) => x instanceof Date ? x.valueOf() : x;

type C = { root: string; field: string };
type T = Promise<string[]>;

export class Redis extends StorageAdapter<C, T> {
  protected redis: RedisClient;
  operators: ConcreteQueryOperatorRecord<C, T>;

  constructor(init: RedisConfigDeno) {
    super("Upstash Redis");
    this.redis = new RedisClient(init);
    this.operators = {
      eq: (value) => async ({ root, field }) => {
        if (!value) {
          return await this.redis.smembers(`${root}:k`);
        }
        return await this.redis.smembers(`${root}:s:${field}:${value}`) ?? [];
      },
      gt: (value) => async ({ root, field }) => {
        if (!value) {
          return await this.redis.smembers(`${root}:k`);
        }
        const score = toScore(value);
        return await this.redis.zrange(`${root}:z:${field}`, score, "+inf", {
          byScore: true,
        }) ?? [];
      },
      lt: (value) => async ({ root, field }) => {
        if (!value) {
          return await this.redis.smembers(`${root}:k`);
        }
        const score = toScore(value);
        return await this.redis.zrange(`${root}:z:${field}`, "-inf", score, {
          byScore: true,
        }) ?? [];
      },
      and: (...qs) => async ({ root, field }) => {
        const kss: string[][] = await Promise.all(
          qs.map((it) => it({ root, field })),
        );
        return intersect(...kss);
      },
      or: (...qs) => async ({ root, field }) => {
        const kss: string[][] = await Promise.all(
          qs.map((it) => it({ root, field })),
        );
        return union(...kss);
      },
    };
  }

  createResourceStorage<R extends AbstractResourceType>(
    root: string,
  ): ConcreteResourceStorage<R, C, T> {
    const joinKeyOptions = { seperator: "/", prefix: root };

    return {
      get: async (spec) => {
        const key = joinKeys(spec, joinKeyOptions);
        const object = await this.redis.hgetall<ResourceObject<R>>(key);
        if (!object) {
          throw new errors.NotFound();
        }
        return object;
      },
      put: async (spec, value) => {
        const key = joinKeys(spec, joinKeyOptions);
        const object = { ...spec, ...value };

        const pipeline = this.redis.multi();

        pipeline.sadd(`${root}:k`, key);
        pipeline.hset(key, object);

        for (const field in filterValues(object, isPrimitive)) {
          const value = object[field];

          pipeline.sadd(`${root}:s:${field}:${value}`, key);

          if (isQuantity(value)) {
            const score = toScore(value);
            pipeline.zadd(`${root}:z:${field}`, { score, member: key });
          }
        }
        await pipeline.exec();
      },
      list: async (query) => {
        let keys = await this.redis.smembers(`${root}:k`);

        for (const field in query) {
          const condition = query[field];
          if (condition) {
            const value = await condition({ root, field });
            keys = intersect(keys, value);
          }
        }
        if (keys.length) {
          const pipeline = this.redis.multi();
          keys.forEach((it) => pipeline.hgetall<ResourceObject<R>>(it));
          return await pipeline.exec();
        }
        return [];
      },
      set: async (spec, value) => {
        const key = joinKeys(spec, joinKeyOptions);
        const object = { ...spec, ...value };

        const existing = await this.redis.hmget(key, ...Object.keys(value));
        if (!existing) {
          throw new errors.NotFound();
        }

        const pipeline = this.redis.multi();
        pipeline.hmset(key, object);

        for (const field in filterValues(object, isPrimitive)) {
          const value = object[field];
          if (!value) continue;

          pipeline.smove(
            `${root}:s:${field}:${existing[field]}`,
            `${root}:s:${field}:${value}`,
            key,
          );

          if (isQuantity(value)) {
            const score = toScore(value);
            pipeline.zadd(`${root}:z:${field}`, { score, member: key });
          }
        }
        await pipeline.exec();
      },
      flush: async () => {
        await this.redis.flushdb();
      },
    };
  }
}

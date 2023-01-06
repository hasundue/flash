import {
  assert,
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.171.0/testing/asserts.ts";
import { ConcreteQuery, ConcreteQueryOperatorRecord } from "./query.ts";
import {
  AbstractResourceType,
  ResourceObject,
  ResourceStorage,
  ResourceValue,
} from "./resource.ts";

export interface ConcreteResourceStorage<R extends AbstractResourceType, C, T>
  extends ResourceStorage<R> {
  list: (
    query?: ConcreteQuery<ResourceObject<R>, C, T>,
  ) => Promise<ResourceObject<R>[]>;
  get: (keys: R["spec"]) => Promise<ResourceObject<R>>;
  put: (keys: R["spec"], value: ResourceValue<R>) => Promise<void>;
  set: (
    keys: R["spec"],
    fields: Partial<ResourceValue<R>>,
  ) => Promise<void>;
  flush: () => Promise<void>;
}

type TestResource = {
  spec: { owner: string; repo: string };
  body: { tags: string[] };
  meta: { created_at: number };
};

export abstract class StorageAdapter<C, T> {
  protected name: string;
  abstract operators: ConcreteQueryOperatorRecord<C, T>;

  abstract createResourceStorage<R extends AbstractResourceType>(
    root: string,
  ): ConcreteResourceStorage<R, C, T>;

  constructor(name: string) {
    this.name = name;
  }

  test() {
    Deno.test(this.name, async (t) => {
      const { and, or, eq, gt, lt } = this.operators;

      const owner = "hasundue";
      const repo = "flash";

      const storage = this.createResourceStorage<TestResource>("test");

      await t.step("flush", async () => {
        await storage.flush();
        const data = await storage.list();
        assert(!data.length, "storage is not empty");
      });

      await t.step("put", async () => {
        const now = Date.now();
        const tags = ["test"];

        await storage.put({ owner, repo }, {
          tags,
          created_at: now,
        });
        assertObjectMatch(
          await storage.get({ owner, repo }),
          { owner, repo, tags, created_at: now },
        );
      });

      await t.step("set", async () => {
        const newTags = ["test", "flash"];

        await storage.set({ owner, repo }, { tags: newTags });

        assertObjectMatch(
          await storage.get({ owner, repo }),
          { owner, repo, tags: newTags },
        );
      });

      await t.step("list", async (t) => {
        const started = Date.now();

        await storage.put({ owner, repo: "example" }, {
          tags: ["test"],
          created_at: Date.now(),
        });

        await t.step("ALL (2)", async () => {
          const result = await storage.list();
          assertEquals(result.length, 2);

          assertObjectMatch(
            result[1],
            { owner, repo: "example" },
          );
          assertObjectMatch(
            result[0],
            { owner, repo },
          );
        });

        await t.step("owner = hasundue (2)", async () => {
          const result = await storage.list({ owner: eq("hasundue") });
          assertEquals(result.length, 2);
        });

        await t.step("owner = denoland (0)", async () => {
          const result = await storage.list({ owner: eq("denoland") });
          assertEquals(result.length, 0);
        });

        await t.step("repo = flash (1)", async () => {
          const result = await storage.list({ repo: eq("flash") });
          assertEquals(result.length, 1);
        });

        await t.step("owner = hasundue, repo = flash (1)", async () => {
          const result = await storage.list({
            owner: eq("hasundue"),
            repo: eq("flash"),
          });
          assertEquals(result.length, 1);
        });

        await t.step("owner = hasundue && owner = denoland (0)", async () => {
          const result = await storage.list({
            owner: and(eq("hasundue"), eq("denoland")),
          });
          assertEquals(result.length, 0);
        });

        await t.step("owner = hasundue || owner = denoland (2)", async () => {
          const result = await storage.list({
            owner: or(eq("hasundue"), eq("denoland")),
          });
          assertEquals(result.length, 2);
        });

        await t.step("created_at < now (2)", async () => {
          const now = Date.now();
          const result = await storage.list({ created_at: lt(now) });
          assertEquals(result.length, 2);
        });

        await t.step("created_at > now (0)", async () => {
          const now = Date.now();
          const result = await storage.list({ created_at: gt(now) });
          assertEquals(result.length, 0);
        });

        await t.step("started < created_at < now (1)", async () => {
          const now = Date.now();
          const result = await storage.list({
            created_at: and(gt(started), lt(now)),
          });
          assertEquals(result.length, 1);
        });
      });
    });
  }
}

export type AbstractStorageAdapter = StorageAdapter<any, any>;

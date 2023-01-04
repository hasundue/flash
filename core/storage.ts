import {
  assert,
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.170.0/testing/asserts.ts";
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
  meta: { created_at: number; updated_at: number };
};

export abstract class StorageAdapter<C, T> {
  protected name: string;
  protected abstract operators: ConcreteQueryOperatorRecord<C, T>;

  abstract createResourceStorage<R extends AbstractResourceType>(
    root: string,
  ): ConcreteResourceStorage<R, C, T>;

  constructor(name: string) {
    this.name = name;
  }

  test() {
    Deno.test(this.name, async (t) => {
      const { and, or, eq } = this.operators;

      const owner = "hasundue";
      const repo = "flash";

      const tags = ["test"];
      const started = Date.now();

      const storage = this.createResourceStorage<TestResource>(
        `test:${started}`,
      );

      await t.step("flush", async () => {
        await storage.flush();
        const data = await storage.list();
        assert(!data.length, "storage is not empty");
      });

      await t.step("put", async () => {
        await storage.put({ owner, repo }, {
          tags,
          created_at: started,
          updated_at: started,
        });
        assertObjectMatch(
          await storage.get({ owner, repo }),
          { owner, repo, tags, created_at: started, updated_at: started },
        );
      });

      await t.step("set", async () => {
        const newTags = ["test", "flash"];
        const now = Date.now();

        await storage.set({ owner, repo }, {
          tags: newTags,
          updated_at: now,
        });
        assertObjectMatch(
          await storage.get({ owner, repo }),
          { owner, repo, tags: newTags, created_at: started, updated_at: now },
        );
      });

      await t.step("list", async (t) => {
        const now = Date.now();

        await storage.put({ owner, repo: "example" }, {
          tags: [],
          created_at: now,
          updated_at: now,
        });

        await t.step("ALL (2)", async () => {
          const result = await storage.list();
          assertEquals(result.length, 2);
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
          assertEquals(result.length, 0);
        });
      });
    });
  }
}

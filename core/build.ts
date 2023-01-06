import { mapEntries } from "https://deno.land/std@0.170.0/collections/map_entries.ts";
import { dirname, join } from "https://deno.land/std@0.170.0/path/mod.ts";
import { Hono } from "https://deno.land/x/hono@v2.7.1/mod.ts";
import { getTypeScriptReader } from "https://esm.sh/typeconv@1.8.0";
import { Application } from "./application.ts";
import { AbstractResourceType, Resource } from "./resource.ts";

const reader = getTypeScriptReader();

export async function build(source: string) {
  console.info("Building the app...");
  const app = new Hono();

  // TODO: introduce type-safety
  try {
    const mod = await import(join(Deno.cwd(), source));
    const specs = mod.default as Application;

    for (const def of specs.resources) {
      const file = join(Deno.cwd(), dirname(source), def.source);

      const contents = await Deno.readTextFile(file);
      const schema = await reader.read(contents, { warn: () => {} });

      const types = schema.data.types;
      if (types.length > 1) {
        throw new Error(
          "Multiple resource definitions in a single file are not allowed.",
        );
      }
      const type = types[0] as any;

      const root = "/" + def.alias.plural;
      const mod = await import(file);

      const fn: Resource<AbstractResourceType> = mod.default;

      const storage = def.storage.createResourceStorage(root);
      const methods = fn({
        storage,
        operators: def.storage.operators,
      });

      if (methods.list) {
        const params = type.properties.query.node.properties;

        app.get(root, async (ctx) => {
          const query = mapEntries(params, ([key]) => [
            key,
            ctx.req.query(key) ?? undefined,
          ]);
          const vals = await methods.list!(query);
          return ctx.json(vals, 200);
        });
      }

      const params = type.properties.spec.node.properties;

      let path = root;
      Object.keys(params).forEach((it) => path += `/:${it}`);

      if (methods.get) {
        app.put(path, async (ctx) => {
          const keys = mapEntries(params, ([key]) => [
            key,
            ctx.req.param(key) ?? undefined,
          ]);
          await methods.get!(keys);
          return ctx.json(null, 200);
        });
      }

      if (methods.put) {
        app.put(path, async (ctx) => {
          const keys = mapEntries(params, ([key]) => [
            key,
            ctx.req.param(key) ?? undefined,
          ]);
          // TODO: validate the body
          await methods.put!(keys, await ctx.req.json());
          return ctx.json(null, 204);
        });
      }

      if (methods.set) {
        app.put(path, async (ctx) => {
          const keys = mapEntries(params, ([key]) => [
            key,
            ctx.req.param(key) ?? undefined,
          ]);
          // TODO: validate the body
          await methods.set!(keys, await ctx.req.json());
          return ctx.json(null, 204);
        });
      }
    }
  } catch (e) {
    throw new Error("Invalid resource definition.", { cause: e });
  }

  return app;
}

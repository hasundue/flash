import { mapEntries } from "https://deno.land/std@0.170.0/collections/map_entries.ts";
import { join } from "https://deno.land/std@0.170.0/path/mod.ts";
import { Hono } from "https://deno.land/x/hono@v2.1.4/mod.ts";
import { getTypeScriptReader } from "https://esm.sh/typeconv@1.8.0";
import { Application } from "./application.ts";
import { AbstractResourceType, Resource } from "./resource.ts";

const reader = getTypeScriptReader();

export async function build(specs: Application) {
  console.info("Building the app...");
  const app = new Hono();

  // TODO: Introduce type-safety
  try {
    for (const def of specs.resources) {
      const src = await Deno.readTextFile(
        join(Deno.cwd(), def.source),
      );
      const schema = await reader.read(src, { warn: () => {} });
      console.debug(schema);

      const types = schema.data.types;
      if (types.length > 1) {
        throw new Error(
          "Multiple resource definitions in a single file are not allowed.",
        );
      }
      const type = types[0] as any;
      console.debug(type);

      const root = "/" + def.alias;
      const mod = await import(
        join(Deno.cwd(), def.source)
      );
      console.debug(mod);

      const fn: Resource<AbstractResourceType> = mod.default;

      const storage = def.storage.createResourceStorage(root);
      const methods = fn({
        storage,
        operators: def.storage.operators,
      });

      if (methods.list) {
        const params = type.properties.query.node.properties;
        console.debug(params);

        app.get(root, async (ctx) => {
          const query = mapEntries(params, ([key]) => [
            key,
            ctx.req.query(key),
          ]);
          const vals = await methods.list!(query);
          return ctx.json(vals);
        });
      }

      const params = type.properties.spec.node.properties;
      console.debug(params);

      let path = root;
      Object.keys(params).forEach((it) => path += `/:${it}`);

      if (methods.put) {
        app.put(path, async (ctx) => {
          const keys = mapEntries(params, ([key]) => [
            key,
            ctx.req.param(key),
          ]);
          console.debug(keys);

          const body = await ctx.req.json();
          console.debug(body);

          await methods.put!(keys, body);
          return ctx.json(null, 201);
        });
      }
    }
  } catch (e) {
    throw new Error("Invalid resource definition.", { cause: e });
  }
  console.debug(app);

  return app;
}

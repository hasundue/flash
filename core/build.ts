import { mapEntries } from "https://deno.land/std@0.200.0/collections/map_entries.ts";
import { dirname, join } from "https://deno.land/std@0.200.0/path/mod.ts";
import { Hono } from "https://deno.land/x/hono@v3.5.6/mod.ts";
import { getTypeScriptReader } from "https://esm.sh/typeconv@2.3.1/";
import { Application } from "./application.ts";
import { AbstractResourceType, Resource } from "./resource.ts";

const reader = getTypeScriptReader();

export async function build(source: string) {
  console.info("Building the app...");
  const app = new Hono();

  // TODO: Introduce type-safety
  try {
    const mod = await import(join(Deno.cwd(), source));
    const specs = mod.default as Application;
    console.debug(specs);

    for (const def of specs.resources) {
      const file = join(Deno.cwd(), dirname(source), def.source);
      console.debug(file);

      const contents = await Deno.readTextFile(file);
      const schema = await reader.read(contents, { warn: () => {} });
      console.debug(schema);

      const types = schema.data.types;
      if (types.length > 1) {
        throw new Error(
          "Multiple resource definitions in a single file are not allowed.",
        );
      }
      const type = types[0] as any;
      console.debug(type);

      const root = "/" + def.alias.plural;
      const mod = await import(file);
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
            ctx.req.query(key) ?? undefined,
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
            ctx.req.param(key) ?? undefined,
          ]);
          await methods.put!(keys, await ctx.req.json());
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

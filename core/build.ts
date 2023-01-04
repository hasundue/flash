import { mapEntries } from "https://deno.land/std@0.170.0/collections/map_entries.ts";
import { join } from "https://deno.land/std@0.170.0/path/mod.ts";
import { Hono } from "https://deno.land/x/hono@v2.1.4/mod.ts";
import { getTypeScriptReader } from "https://esm.sh/typeconv@1.8.0";
import { Application } from "./application.ts";
import { AbstractResourceType, Resource } from "./resource.ts";

const reader = getTypeScriptReader();

export async function build(specs: Application) {
  const app = new Hono();

  // TODO: Introduce type-safety
  try {
    for (const def of specs.resources) {
      const src = await Deno.readTextFile(
        join(Deno.cwd(), def.src),
      );
      const schema = await reader.read(src, { warn: () => {} });
      console.debug(schema);

      const types = schema.data.types;
      if (types.length > 1) {
        throw new Error(
          "Multiple resource definition in a single file is not allowed",
        );
      }
      const type = types[0] as any;
      console.debug(type);

      const root = "/" + def.alias.plural;
      const mod = await import(
        join(Deno.cwd(), def.src)
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

      let path = root;

      const params = Object.keys(type.properties.spec.node.properties);
      console.log(params);

      params.forEach((it) => path += `/:${it}`);

      // app.get(path, (ctx) => {
      //   return ctx.text("hello");
      // });
    }
  } catch (e) {
    throw new Error("Invalid resource definition", { cause: e });
  }
  console.log(app);

  return app;
}

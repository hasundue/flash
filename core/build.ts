import { Hono } from "https://deno.land/x/hono@v2.1.4/mod.ts";
import { getTypeScriptReader } from "npm:typeconv@1.8.0";
import { Application } from "./application.ts";

const reader = getTypeScriptReader();

export async function build(specs: Application) {
  const app = new Hono();

  for (const resource of specs.resources) {
    const src = await Deno.readTextFile(resource.src);
    const schema = await reader.read(src, { warn: () => {} });

    let path = "/" + resource.alias.plural;

    // TODO: Introduce type-safety
    try {
      for (const type of schema.data.types) {
        const asAny = type as any;
        const params = Object.keys(asAny.properties.spec.node.properties);

        params.forEach((it) => path += `/:${it}`);
      }
    } catch (e) {
      throw new Error("Invalid resource definition", { cause: e });
    }

    app.get(path, (ctx) => {
      return ctx.text("hello");
    });
  }
  console.log(app);

  return app;
}

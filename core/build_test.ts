import { build } from "./build.ts";

Deno.test("Deno Deploy", async () => {
  await build("./example/deploy.ts");
});

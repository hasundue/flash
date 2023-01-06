import { assertEquals } from "https://deno.land/std@0.170.0/testing/asserts.ts";
import { build } from "../mod.ts";

const app = await build("./deploy.ts");

const host = "http://localhost:8000";

Deno.test("Deno Deploy", async (t) => {
  await t.step("put", async () => {
    const res = await app.request(host + "/repos/hasundue/flash", {
      method: "PUT",
      body: JSON.stringify({ tags: ["test"] }),
    });
    assertEquals(res.status, 201);
  });
  await t.step("get", async () => {
    const res = await app.request(host + "/repos", {
      method: "GET",
    });
    assertEquals(res.status, 200);
    console.log(await res.json());
  });
});

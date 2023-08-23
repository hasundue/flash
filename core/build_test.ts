import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.199.0/testing/asserts.ts";
import { build } from "./build.ts";

const host = "http://localhost:8000";

Deno.test("Deno Deploy", async (t) => {
  const app = await build("./example/app.ts");

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

    const json = await res.json();
    assertObjectMatch(
      json,
      { owner: "hasundue", repo: "flash", tags: ["test"] },
    );
  });
});

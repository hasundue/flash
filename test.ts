import { readLines } from "https://deno.land/std@0.144.0/io/mod.ts";
import { assertObjectMatch } from "https://deno.land/std@0.144.0/testing/asserts.ts";

Deno.test("router", async () => {
  const proc = Deno.run({
    cmd: ["denoflare", "serve", "./example.ts"],
    stdout: "piped",
  });

  for await (const line of readLines(proc.stdout)) {
    const matched = line.match(/http:\/\/localhost:\d+/);
    if (matched) break;
  }

  const host = "http://localhost:8080";

  const knock = async (path: string, method?: string) => {
    const response = await fetch(host + path, { method: method ?? "GET" });
    return await response.json();
  };

  assertObjectMatch(
    await knock("/"),
    { message: "Flash Demo" },
  );

  assertObjectMatch(
    await knock("/create", "POST"),
    { message: "Created", status: 201 },
  );

  assertObjectMatch(
    await knock("/create", "GET"),
    { status: 404 },
  );

  assertObjectMatch(
    await knock("/object/test"),
    { name: "test" },
  );

  proc.stdout.close();
  proc.close();
});

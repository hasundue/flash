import { readLines } from "https://deno.land/std@0.144.0/io/mod.ts";
import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.144.0/testing/asserts.ts";

async function startServer(file: string, ...options: string[]) {
  const proc = Deno.run({
    cmd: ["denoflare", "serve", file].concat(options),
    stdout: "piped",
  });

  for await (const line of readLines(proc.stdout)) {
    if (line.match("Local server running")) break;
  }

  return proc;
}

const assert = async (
  path: string,
  method: string,
  status: number,
  value?: Record<string, unknown> | string,
) => {
  const host = "http://localhost:8080";

  const response = await fetch(host + path, { method: method });
  assertEquals(response.status, status);

  const json = await response.json();
  if (value) {
    if (typeof value === "string") assertEquals(json, value);
    else assertObjectMatch(json, value);
  }
};

Deno.test("router", async () => {
  const proc = await startServer("../integration/worker.test.ts");

  await assert("/", "GET", 200, "Welcome to flash!");
  await assert("/", "POST", 404, { message: "URL not exist." });

  await assert("/resources", "POST", 201, { name: "flash" });
  await assert("/resources", "GET", 404);

  await assert("/resources/test", "GET", 200, { name: "test" });
  await assert("/resources/test", "POST", 404);

  proc.stdout.close();
  proc.close();
});

/*
Deno.test("durable object", async () => {
  const proc = await startServer(
    "./examples/durable_object.ts",
    "--do-namespace-binding",
    "do:local:DO",
  );

  assertObjectMatch(
  await knock("/test"),
  { id: "8feb29077a1df95bd8e261f2a94a8fe5ccb19ba61c4c0873d391e987982fbbd3" },
  );

  proc.stdout.close();
  proc.close();
});
*/

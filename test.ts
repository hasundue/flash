import { readLines } from "https://deno.land/std@0.144.0/io/mod.ts";
import { assertObjectMatch } from "https://deno.land/std@0.144.0/testing/asserts.ts";

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

const knock = async (path: string, method?: string) => {
  const host = "http://localhost:8080";
  const response = await fetch(host + path, { method: method ?? "GET" });
  return await response.json();
};

Deno.test("router", async () => {
  const proc = await startServer("./examples/router.ts");

  assertObjectMatch(
    await knock("/"),
    { message: "Welcome to localhost!" },
  );

  assertObjectMatch(
    await knock("/create", "POST"),
    { status: 201 },
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

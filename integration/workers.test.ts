import { readLines } from "https://deno.land/std@0.144.0/io/mod.ts";
import {
  assertEquals,
  assertObjectMatch,
} from "https://deno.land/std@0.144.0/testing/asserts.ts";

async function startServer(file: string, ...options: string[]) {
  const proc = Deno.run({
    cmd: ["denoflare", "serve", file].concat(options),
    stdout: "piped",
    stderr: "inherit",
  });

  for await (const line of readLines(proc.stdout)) {
    if (line.match("Local server running")) break;
  }

  // proc.stdout.readable.pipeTo(Deno.stdout.writable);

  return proc;
}

const host = "http://localhost:8080";

Deno.test("router", async (t) => {
  const test = async (
    request: {
      path: string;
      method: string;
      body?: Record<string, unknown>;
    },
    expect: {
      status: number;
      value?: Record<string, unknown> | string;
    },
  ) => {
    const { path, method, body } = request;
    const { status, value } = expect;

    const str = body ? JSON.stringify(body) : "";

    await t.step(
      `${method}\t${path}\t${str}`,
      async () => {
        const response = await fetch(host + path, {
          method: method,
          body: JSON.stringify(body),
          headers: body ? { "Content-type": "application/json" } : undefined,
        });

        const json = await response.json();

        const log = response.status === 500 ? json.stack : json;
        console.log(log);

        assertEquals(response.status, status);

        if (value) {
          if (typeof value === "string") assertEquals(json, value);
          else assertObjectMatch(json, value);
        }
      },
    );
  };

  const proc = await startServer(
    "./examples/worker.ts",
    "--do-namespace-binding",
    "do:local:MyDurableObject",
  );

  try {
    await test({ path: "/", method: "GET" }, {
      status: 200,
      value: "Welcome to flash!",
    });
    await test({ path: "/", method: "POST" }, { status: 404 });

    await test({ path: "/users", method: "GET" }, { status: 200 });

    await test({ path: "/users", method: "POST" }, { status: 400 });

    await test({ path: "/users", method: "POST", body: { name: "flash" } }, {
      status: 201,
    });

    await test({ path: "/users/flash", method: "POST" }, { status: 404 });
    await test({ path: "/users/flash", method: "GET" }, { status: 200 });
    await test({ path: "/users/deno", method: "GET" }, { status: 404 });
  } finally {
    proc.stdout.close();
    proc.close();
  }
});

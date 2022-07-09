import { assertEquals } from "../deps_dev.ts";
import { getStoragePath, parentOf } from "./router.ts";

Deno.test('parentOf("/")', () => {
  assertEquals(
    parentOf("/"),
    "/",
  );
});

Deno.test('parentOf("/users")', () => {
  assertEquals(
    parentOf("/users"),
    "/",
  );
});

Deno.test('parentOf("/users/:name")', () => {
  assertEquals(
    parentOf("/users/:name"),
    "/users",
  );
});

Deno.test('getStoragePath("/users")', () => {
  assertEquals(
    getStoragePath("/users"),
    "/users",
  );
});

Deno.test('getStoragePath<"/users/:name", "/users">("/users/:name")', () => {
  assertEquals(
    getStoragePath("/users/:name"),
    "/users",
  );
});

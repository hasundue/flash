import { assertEquals } from "https://deno.land/std@0.181.0/testing/asserts.ts";
import { describe } from "https://deno.land/std@0.181.0/testing/bdd.ts";
import { joinKeys } from "./join_keys.ts";

describe("joinKeys", () => {
  const keys = {
    owner: "hasundue",
    repo: "flash",
  };
  assertEquals(
    joinKeys(keys, { prefix: "repos", seperator: "/" }),
    "repos/hasundue/flash",
  );
});

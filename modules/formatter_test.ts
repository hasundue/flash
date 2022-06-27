import { defaultFormatter } from "./formatter.ts";

Deno.test("formatter", () => {
  const res = defaultFormatter({ 201: "Created" });
});

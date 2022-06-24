import { Status, STATUS_TEXT } from "./deps.ts";

/** Converts an object literal to a JSON string and returns
 * a Response with `application/json` as the `content-type`.
 *
 * @example
 * ```typescript
 * import { flash, json } from "https://deno.land/x/flash/mod.ts"
 *
 * flash({
 *  "/": () => json({ message: "hello world"}),
 * })
 * ```
 */
export function json(
  value: Parameters<typeof JSON.stringify>[0],
  init?: ResponseInit,
): Response {
  const headers = init?.headers instanceof Headers
    ? init.headers
    : new Headers(init?.headers);

  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json; charset=utf-8");
  }
  return new Response(JSON.stringify(value) + "\n", {
    statusText: init?.statusText ?? STATUS_TEXT[Status.OK],
    status: init?.status ?? Status.OK,
    headers,
  });
}

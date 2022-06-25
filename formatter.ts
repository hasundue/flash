import { Status, STATUS_TEXT } from "./deps.ts";
import { ResponseObject } from "./mod.ts";

export type Formatter = (obj: ResponseObject) => Response;

export const json: Formatter = (obj) => {
  const value = obj as Exclude<ResponseObject, ResponseInit>;
  const init = obj;

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
};

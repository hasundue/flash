import { Status, STATUS_TEXT } from "./deps.ts";
import { AbstractResponse, ResponseMessage, ResponseObject } from "./mod.ts";

export type Formatter = (res: AbstractResponse) => Response;

export const json: Formatter = (res) => {
  let obj: Parameters<typeof JSON.stringify>[0];

  if (ResponseObject.guard(res)) {
    obj = res;
  } else if (ResponseMessage.guard(res)) {
    obj = {
      message: ResponseMessage.message(res),
      status: ResponseMessage.status(res),
    };
  } else {
    obj = { message: res };
  }

  const value = obj as Exclude<ResponseObject, ResponseInit>;
  const init: ResponseInit = obj;

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

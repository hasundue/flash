import { Status, STATUS_TEXT } from "../deps.ts";
import { ErrorResponse, ResponseObject, SuccessResponse } from "./response.ts";

export type Formatter = (response: ResponseObject, status?: Status) => Response;

export const defaultFormatter: Formatter = (res, sta) => {
  const precursor = SuccessResponse.guard(res) || ErrorResponse.guard(res)
    ? Object.values(res)[0]
    : res;

  const status = sta ?? (
    SuccessResponse.guard(res) || ErrorResponse.guard(res)
      ? parseInt(Object.keys(res)[0]) as Status
      : undefined
  );

  if (typeof precursor === "object" && !Array.isArray(precursor)) {
    const { statusText, headers, ...value }: {
      statusText?: string;
      headers?: Headers;
      value: Record<string, unknown>;
    } = precursor;

    const init = {
      statusText: statusText ??
        (status ? STATUS_TEXT[status] : STATUS_TEXT[Status.OK]),
      status: status ?? Status.OK,
      headers: headers instanceof Headers ? headers : new Headers(headers),
    };

    if (!init.headers.has("Content-Type")) {
      init.headers.set("Content-Type", "application/json; charset=utf-8");
    }

    return new Response(JSON.stringify(value) + "\n", init);
  } else {
    const init = {
      statusText: status ? STATUS_TEXT[status] : STATUS_TEXT[Status.OK],
      status: status ?? Status.OK,
      headers: new Headers(),
    };
    init.headers.set("Content-Type", "application/json; charset=utf-8");

    return new Response(JSON.stringify(precursor) + "\n", init);
  }
};

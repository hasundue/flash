import { ErrorStatus, Status, STATUS_TEXT, SuccessStatus } from "../deps.ts";
import { FormatterMethods } from "../mod.ts";
import { getKey, getKeys, getObject, getValues, PickOne } from "./types.ts";
import { ResponseLike } from "./response.ts";

type Format = { message: true };

const Format = {
  message: { message: true } as const,

  guard(obj: Record<string, unknown>): obj is Format {
    return getKeys(obj).every((key) =>
      getKeys(Format.message).some((field) => field === key)
    );
  },
};

export type FormatInit =
  | Format
  | {
    success?: Format;
    error?: Format;
  }
    & {
      [P in Status]?: Format;
    };

export class Formatter implements FormatterMethods {
  private readonly spec: { [P in Status]?: Format };

  constructor(init?: FormatInit) {
    this.spec = {};

    if (!init) return;

    const statuss = getValues(Status);

    if (Format.guard(init)) {
      const entries = statuss.map((
        key,
      ): [Status, Format] => [key, Format.message]);

      this.spec = getObject(entries);
      return;
    }

    if (init.success) {
      const entries = statuss.filter((status) => status < 400).map((
        key,
      ) => [key, Format.message] as [SuccessStatus, Format]);

      this.spec = getObject(entries);
    }

    if (init.error) {
      const entries = statuss.filter((status) => status >= 400).map((
        key,
      ) => [key, Format.message] as [ErrorStatus, Format]);

      this.spec = getObject(entries);
    }

    for (const status of getKeys(init)) {
      if (status === "success" || status === "error") continue;
      this.spec[status] = init[status];
    }
  }

  format(precursor: ResponseLike): Response {
    if (precursor instanceof Response) {
      return precursor;
    }
    const statusAndBody: PickOne<{ [P in Status]: unknown }> = precursor;
    const status = getKey(statusAndBody);
    const body = statusAndBody[status];
    const format = this.spec[status];
    const { headers, statusText }: Omit<ResponseInit, "status"> = precursor;

    return new Response(
      format?.message && typeof body === "string"
        ? JSON.stringify({ message: body })
        : JSON.stringify(body),
      {
        headers: headers instanceof Headers ? headers : new Headers(headers),
        status,
        statusText: statusText ?? STATUS_TEXT[status],
      },
    );
  }
}

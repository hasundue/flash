import { ErrorStatus, SuccessfulStatus } from "./deps.ts";
import { PickOne } from "./types.ts";

export type SuccessObject =
  & PickOne<
    {
      [code in SuccessfulStatus]: unknown;
    }
  >
  & Omit<ResponseInit, "status">;

export const SuccessResponse = {
  guard(obj: ResponseLike): obj is SuccessObject {
    return Object.keys(obj).some((key) => key.match(/2\d{2}/) !== null);
  },
};

export type ErrorObject =
  & PickOne<
    {
      [code in ErrorStatus]: unknown;
    }
  >
  & Omit<ResponseInit, "status">;

export const ErrorResponse = {
  guard(obj: ResponseLike): obj is ErrorObject {
    return Object.keys(obj).some((key) => key.match(/[4-5]\d{2}/));
  },
};

export type ResponseLike = SuccessObject | ErrorObject | Response;

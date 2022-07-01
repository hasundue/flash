import { ErrorStatus, Status, SuccessStatus } from "../deps.ts";
import { PickOne } from "./types.ts";

export type SuccessObject =
  & PickOne<
    {
      [code in SuccessStatus]: unknown;
    }
  >
  & Omit<ResponseInit, "status">;

export const SuccessResponse = {
  guard(obj: Record<string | number | symbol, unknown>): obj is SuccessObject {
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
  guard(obj: Record<string | number | symbol, unknown>): obj is ErrorObject {
    return Object.keys(obj).some((key) => key.match(/[4-5]\d{2}/));
  },
};

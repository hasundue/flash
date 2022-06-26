import { ErrorStatus, SuccessfulStatus } from "./deps.ts";
import { JsonObject, PickOne } from "./types.ts";

export type SuccessResponse =
  & PickOne<
    {
      [code in SuccessfulStatus]: JsonObject;
    }
  >
  & Omit<ResponseInit, "status">;

export const SuccessResponse = {
  guard(obj: ResponseObject): obj is SuccessResponse {
    // if (obj !== "object" || Array.isArray(obj)) return false;
    // console.log(obj);
    return Object.keys(obj).some((key) => key.match(/2\d{2}/) !== null);
  },
};

export type ErrorResponse =
  & PickOne<
    {
      [code in ErrorStatus]: string;
    }
  >
  & Omit<ResponseInit, "status">;

export const ErrorResponse = {
  guard(obj: ResponseObject): obj is ErrorResponse {
    return Object.keys(obj).some((key) => key.match(/[4-5]\d{2}/));
  },
};

export type ResponseObject = SuccessResponse | ErrorResponse | JsonObject;

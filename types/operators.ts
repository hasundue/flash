const EQUALITY_OPERATORS = [
  "eq",
  "ne",
] as const;

const COMPARISON_OPERATORS = [
  "lt",
  "gt",
] as const;

const LOGICAL_OPERATORS = [
  "and",
  "or",
] as const;

type EqualityOperatorName = typeof EQUALITY_OPERATORS[number];
type ComparisonOperatorName = typeof COMPARISON_OPERATORS[number];
type LogicalOperatorName = typeof LOGICAL_OPERATORS[number];

export type QueryOperator =
  | EqualityOperator
  | ComparisonOperator
  | LogicalOperator;

type QueryUndefined = { it: undefined };
type QueryBoolean = { it: unknown };

export type QueryOperatorResult = QueryUndefined | QueryBoolean;

type EqualityOperator = <T extends unknown>(
  x: T | undefined,
) => typeof x extends undefined ? QueryUndefined : QueryBoolean;

type ComparisonOperator = <T extends unknown>(
  x: T | undefined,
) => typeof x extends undefined ? QueryUndefined : QueryBoolean;

type LogicalOperator = (...xs: QueryOperatorResult[]) => QueryBoolean;

export type QueryOperatorRecord =
  & {
    [O in EqualityOperatorName]: EqualityOperator;
  }
  & {
    [O in ComparisonOperatorName]: ComparisonOperator;
  }
  & {
    [O in LogicalOperatorName]: LogicalOperator;
  };

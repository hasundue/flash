const EQUALITY_OPERATORS = [
  "eq",
  "ne",
] as const;

const INEQUALITY_OPERATORS = [
  "lt",
  "gt",
] as const;

const LOGICAL_OPERATORS = [
  "and",
  "or",
] as const;

export type Quantity = Date | number;

type EqualityOperatorName = typeof EQUALITY_OPERATORS[number];
type InequalityOperatorName = typeof INEQUALITY_OPERATORS[number];
type LogicalOperatorName = typeof LOGICAL_OPERATORS[number];

export type Equality = (field: string, _type: "equality") => unknown;
export type Inequality = (field: string, _type: "inequality") => unknown;

type EqualityOperator = (x: unknown) => Equality;
type InequalityOperator = (x: Quantity | undefined) => Inequality;

type LogicalOperator = <
  T extends Equality[] | Inequality[] | (Equality | Inequality)[],
>(
  ...xs: T
) => T extends Equality[] ? Equality : Inequality;

export type QueryOperatorRecord =
  & {
    [O in EqualityOperatorName]: EqualityOperator;
  }
  & {
    [O in InequalityOperatorName]: InequalityOperator;
  }
  & {
    [O in LogicalOperatorName]: LogicalOperator;
  };

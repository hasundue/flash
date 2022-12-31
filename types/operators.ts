const EQUALITY_OPERATORS = [
  "eq",
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

export function isQuantity(value: unknown): value is Quantity {
  return typeof value === "number" || value instanceof Date;
}

type EqualityOperatorName = typeof EQUALITY_OPERATORS[number];
type InequalityOperatorName = typeof INEQUALITY_OPERATORS[number];
type LogicalOperatorName = typeof LOGICAL_OPERATORS[number];

export type Equality = (context: any, _type?: "equality") => any;
export type Inequality = (context: any, _type?: "inequality") => any;

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

export type ConcreteEquality<Context, Result> = (
  context: Context,
  _type?: "equality",
) => Result;

export type ConcreteInequality<Context, Result> = (
  context: Context,
  _type?: "inequality",
) => Result;

type ConcreteEqualityOperator<Context, Result> = (
  x: unknown,
) => ConcreteEquality<Context, Result>;

type ConcreteInequalityOperator<Context, Result> = (
  x: Quantity | undefined,
) => ConcreteInequality<Context, Result>;

type ConcreteLogicalOperator<C, R> = <
  T extends
    | ConcreteEquality<C, R>[]
    | ConcreteInequality<C, R>[]
    | (ConcreteEquality<C, R> | ConcreteInequality<C, R>)[],
>(
  ...xs: T
) => T extends ConcreteEquality<C, R>[] ? ConcreteEquality<C, R>
  : ConcreteInequality<C, R>;

export type ConcreteQueryOperatorRecord<Context, Result> =
  & {
    [O in EqualityOperatorName]: ConcreteEqualityOperator<Context, Result>;
  }
  & {
    [O in InequalityOperatorName]: ConcreteInequalityOperator<Context, Result>;
  }
  & {
    [O in LogicalOperatorName]: ConcreteLogicalOperator<Context, Result>;
  };

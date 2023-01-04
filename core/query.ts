const EQUALITY_OPERATORS = [
  "eq",
] as const;

type EqualityOperatorName = typeof EQUALITY_OPERATORS[number];

const QUANTITY_OPERATORS = [
  "lt",
  "gt",
] as const;

type InequalityOperatorName = typeof QUANTITY_OPERATORS[number];

const LOGICAL_OPERATORS = [
  "and",
  "or",
] as const;

type LogicalOperatorName = typeof LOGICAL_OPERATORS[number];

export type Quantity = Date | number;

export function isQuantity(value: unknown): value is Quantity {
  return typeof value === "number" || value instanceof Date;
}

export type Primitive = Quantity | string;

export function isPrimitive(value: unknown): value is Primitive {
  return isQuantity(value) || typeof value === "string";
}

type Equality = (context: any, _type?: "equality") => any;
type Inequality = (context: any, _type?: "inequality") => any;

type Object = Record<string, unknown>;

type Queryable<T extends Object> = {
  [K in keyof T]: T[K] extends Primitive ? T[K] : never;
};

export type Query<T extends Object> = Partial<
  {
    [K in keyof Queryable<T>]: Queryable<T>[K] extends Quantity
      ? Equality | Inequality
      : Equality;
  }
>;

type EqualityOperator = (x: Primitive | undefined) => Equality;
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

export type ConcreteQuery<T extends Object, C, R> = Partial<
  {
    [K in keyof Queryable<T>]: Queryable<T>[K] extends Quantity
      ? ConcreteEquality<C, R> | ConcreteInequality<C, R>
      : ConcreteEquality<C, R>;
  }
>;

type ConcreteEquality<Context, Result> = (
  context: Context,
  _type?: "equality",
) => Result;

type ConcreteInequality<Context, Result> = (
  context: Context,
  _type?: "inequality",
) => Result;

type ConcreteEqualityOperator<Context, Result> = (
  x: Primitive,
) => ConcreteEquality<Context, Result>;

type ConcreteInequalityOperator<Context, Result> = (
  x: Quantity,
) => ConcreteInequality<Context, Result>;

type ConcreteLogicalOperator<C, R> = (
  ...xs: (Equality | Inequality)[]
) => ConcreteEquality<C, R> & ConcreteInequality<C, R>;

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

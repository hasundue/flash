const RELATIONAL_OPERATORS = [
  "eq",
  "lt",
  "gt",
] as const;

const LOGICAL_OPERATORS = [
  "and",
  "or",
] as const;

type RelationalOperatorName = typeof RELATIONAL_OPERATORS[number];
type LogicalOperatorName = typeof LOGICAL_OPERATORS[number];
type OperatorName = RelationalOperatorName | LogicalOperatorName;

type Boolean<Op extends OperatorName> =
  | True<Op>
  | False<Op>;

type True<Op extends OperatorName> = true & { _op: Op };
type False<Op extends OperatorName> = false & { _op: Op };

export type RelationalOperator<Op extends RelationalOperatorName> = <
  T extends unknown,
>(
  a: T | undefined,
  b: T | undefined,
) => typeof a extends undefined ? True<Op>
  : typeof b extends undefined ? True<Op>
  : Boolean<Op>;

type LogicalOperator<Op extends LogicalOperatorName> = (
  ...xs: Boolean<OperatorName>[]
) => Boolean<Op>;

export type OperatorRecord =
  & {
    [Op in RelationalOperatorName]: RelationalOperator<Op>;
  }
  & {
    [Op in LogicalOperatorName]: LogicalOperator<Op>;
  };

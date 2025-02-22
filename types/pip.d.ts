export const MAX_PIP_COUNT = 167

export type IntegerRange<F extends number, T extends number> =
  | Exclude<Enumerate<T>, Enumerate<F>>
  | T

type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

export type BackgammonPips = IntegerRange<0, 167>

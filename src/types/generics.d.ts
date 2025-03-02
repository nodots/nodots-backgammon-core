type Enumerate<
  N extends number,
  Acc extends number[] = []
> = Acc['length'] extends N
  ? Acc[number]
  : Enumerate<N, [...Acc, Acc['length']]>

export type IntegerRange<F extends number, T extends number> =
  | Exclude<Enumerate<T>, Enumerate<F>>
  | T

export type Latitude = 'north' | 'south'
export type Longitude = 'east' | 'west'

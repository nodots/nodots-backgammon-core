import { CheckercontainerPosition } from './game'
import { NodotsChecker } from './checker'
import { Bar, Off, Point } from './checkercontainer'

export type Latitude = 'north' | 'south'
export type Longitude = 'east' | 'west'

export type Points = [
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point,
  Point
]

export type CheckercontainerCheckers =
  | []
  | [NodotsChecker]
  | [NodotsChecker, NodotsChecker]
  | [NodotsChecker, NodotsChecker, NodotsChecker]
  | [NodotsChecker, NodotsChecker, NodotsChecker, NodotsChecker]
  | [NodotsChecker, NodotsChecker, NodotsChecker, NodotsChecker, NodotsChecker]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]
  | [
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker,
      NodotsChecker
    ]

export interface NodotsBoard {
  points: Points
  bar: {
    white: Bar
    black: Bar
  }
  off: {
    white: Off
    black: Off
  }
}

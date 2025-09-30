import type { HintRequest, MoveHint } from '@nodots-llc/gnubg-hints'
import { jest } from '@jest/globals'

const defaultNormalization = {
  toGnu: { white: 'white', black: 'black' },
  fromGnu: { white: 'white', black: 'black' },
} as const

export const gnubgHints = {
  initialize: jest.fn(),
  configure: jest.fn(),
  isAvailable: jest.fn(async () => false),
  getBuildInstructions: jest
    .fn()
    .mockReturnValue('Mock build instructions for gnubg-hints'),
  getMoveHints: jest.fn(async (_request?: HintRequest, _maxHints?: number): Promise<MoveHint[]> => []),
  getBestMove: jest.fn(async () => null as MoveHint | null),
  getDoubleHint: jest.fn(),
  getTakeHint: jest.fn(),
  shutdown: jest.fn(),
}

export class GnubgHintsIntegration {}

export const buildHintContextFromGame = jest
  .fn()
  .mockImplementation(() => ({
    request: {} as HintRequest,
    normalization: defaultNormalization,
  }))

export const buildHintContextFromPlay = jest
  .fn()
  .mockImplementation(() => ({
    request: {} as HintRequest,
    normalization: defaultNormalization,
  }))

export const getContainerKind = jest.fn().mockReturnValue('point')

export const getNormalizedPosition = jest.fn().mockReturnValue(0)

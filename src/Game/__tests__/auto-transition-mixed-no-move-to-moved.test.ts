import { describe, it, expect } from '@jest/globals'
import { Board, Dice, Game, Player, generateId } from '../..'
import type {
  BackgammonBoard,
  BackgammonCheckerContainerImport,
  BackgammonGameMoving,
  BackgammonPlayerMoving,
} from '@nodots-llc/backgammon-types/dist'

/**
 * Verifies that a mixed turn (one pre-completed no-move + one real move) ends in 'moved'.
 * This prevents a dead-end 'moving' state with zero ready moves left.
 */
describe('Game.move auto-transition to moved for mixed no-move + real move', () => {
  const buildBoard = (): BackgammonBoard => {
    const imp: BackgammonCheckerContainerImport[] = [
      // White on bar (needs reentry)
      { position: 'bar', direction: 'clockwise', checkers: { color: 'white', qty: 1 } },
      // Block die-6 reentry (point 19 clockwise) with two black checkers
      { position: { clockwise: 19, counterclockwise: 6 }, checkers: { color: 'black', qty: 2 } },
      // Also block 24->18 after reentry (destination 18) with two black checkers
      { position: { clockwise: 18, counterclockwise: 7 }, checkers: { color: 'black', qty: 2 } },
      // Keep reentry point for die-1 (24) open
    ]
    return Board.initialize(imp)
  }

  const makePlayers = (): { white: BackgammonPlayerMoving; black: any } => {
    const white = Player.initialize('white', 'clockwise', 'moving', false, 'human-white') as BackgammonPlayerMoving
    // Force dice to rolled [6,1]
    white.dice = Dice.initialize('white', 'rolled', white.dice.id, [6, 1])
    const black = Player.initialize('black', 'counterclockwise', 'inactive', true, 'robot-black')
    return { white, black }
  }

  it('transitions to moved after executing the only real move when the other die is a pre-completed no-move', () => {
    const board = buildBoard()
    const { white, black } = makePlayers()

    // Initialize activePlay with one reentry move (die 1) and one pre-completed no-move (die 6)
    const activePlay = (require('../..').Play.initialize(board, white))

    // Sanity: at least one ready move exists (reentry), and another may be completed as no-move
    const movesArr = Array.from(activePlay.moves)
    expect(movesArr.length).toBeGreaterThan(0)

    // Build a minimal moving game
    const game: BackgammonGameMoving = {
      id: generateId(),
      stateKind: 'moving',
      board,
      players: [white, black] as any,
      cube: { id: generateId(), stateKind: 'centered', value: 1 } as any,
      activeColor: white.color,
      activePlayer: white,
      inactivePlayer: black as any,
      activePlay,
      createdAt: new Date(),
      version: 'v4.0',
      rules: {},
      settings: {},
    }

    // Execute the reentry by clicking the bar checker
    const bar = board.bar[white.direction]
    const barCheckerId = bar.checkers.find((c) => c.color === 'white')!.id

    const afterMove = Game.move(game, barCheckerId)

    // Expect the game to be moved (turn complete)
    expect(afterMove.stateKind === 'moved' || (afterMove as any).stateKind === 'moved').toBeTruthy()
  })
})


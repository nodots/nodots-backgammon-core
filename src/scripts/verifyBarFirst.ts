import { Board } from '../Board'
import { Game } from '../Game'
import { Player } from '../Player'
import type {
  BackgammonCheckerContainerImport,
  BackgammonBoard,
  BackgammonPlayers,
  BackgammonGameRolling,
  BackgammonPlayerRolling,
  BackgammonPlayerInactive,
} from '@nodots-llc/backgammon-types'

// Build a board where the active player has a checker on the bar and
// also has other checkers on points. Re-entry is always legal because
// we keep all entry points empty.
const boardImport: BackgammonCheckerContainerImport[] = [
  // One white checker on the bar, moving counterclockwise
  { position: 'bar', direction: 'counterclockwise', checkers: { color: 'white', qty: 1 } },
  // Some additional white checkers on points that could otherwise be movable
  { position: { clockwise: 6, counterclockwise: 19 }, checkers: { color: 'white', qty: 2 } },
  { position: { clockwise: 8, counterclockwise: 17 }, checkers: { color: 'white', qty: 1 } },
  // A couple of black checkers far away so they don't block re-entry
  { position: { clockwise: 24, counterclockwise: 1 }, checkers: { color: 'black', qty: 2 } },
]

function run(): number {
  const board: BackgammonBoard = Board.initialize(boardImport)

  // Create players: white (counterclockwise) is active and rolling, black inactive
  const whiteRolling = Player.initialize('white', 'counterclockwise', 'rolling', false) as BackgammonPlayerRolling
  const blackInactive = Player.initialize('black', 'clockwise', 'inactive', false) as BackgammonPlayerInactive

  const players = [whiteRolling, blackInactive] as unknown as BackgammonPlayers

  // Initialize a game in rolling state for white
  const gameRolling = Game.initialize(
    players,
    'test-game',
    'rolling',
    board,
    undefined as any,
    undefined,
    'white',
    whiteRolling,
    blackInactive
  ) as BackgammonGameRolling

  // Roll dice to transition to moving; any dice will allow re-entry on empty points
  const gameAfterRoll = Game.roll(gameRolling)

  if (gameAfterRoll.stateKind !== 'moving') {
    console.error('FAIL: Game not in moving state after roll')
    return 1
  }

  const moving = gameAfterRoll
  const dir = moving.activePlayer.direction

  // Verify there are white checkers on the bar
  const whiteBarCount = moving.board.bar[dir].checkers.filter(c => c.color === 'white').length
  if (whiteBarCount === 0) {
    console.error('FAIL: No white checkers on bar; test setup invalid')
    return 1
  }

  // Collect movable checkers by color and location
  const movableBarWhite = moving.board.bar[dir].checkers.filter(c => c.color === 'white' && c.isMovable)
  const movablePointWhite = moving.board.points.flatMap(p => p.checkers.filter(c => c.color === 'white' && c.isMovable))

  const pass = movableBarWhite.length > 0 && movablePointWhite.length === 0

  if (!pass) {
    console.error('FAIL: Bar-first check failed', {
      movableBarWhite: movableBarWhite.length,
      movablePointWhite: movablePointWhite.length,
    })
    return 1
  }

  console.log('PASS: Bar-first movable enforcement works in rolling→moving transition')
  return 0
}

process.exit(run())


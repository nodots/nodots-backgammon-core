import { Game, Board, Player } from '..'
import type {
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonMoveSkeleton,
} from '@nodots-llc/backgammon-types'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import { spawnSync } from 'child_process'

function anyBarCheckers(game: BackgammonGame): boolean {
  const b = game.board
  return (
    b.bar.clockwise.checkers.length > 0 ||
    b.bar.counterclockwise.checkers.length > 0
  )
}

function count24to1(game: BackgammonGame) {
  const b = game.board
  const cw = game.players.find((p) => p.direction === 'clockwise')!
  const ccw = game.players.find((p) => p.direction === 'counterclockwise')!
  const arrCCW: number[] = []
  for (let pos = 24; pos >= 1; pos--) {
    const pt = b.points.find((p) => p.position.counterclockwise === pos)!
    arrCCW.push(pt.checkers.filter((c) => c.color === ccw.color).length)
  }
  const arrCW: number[] = []
  for (let pos = 24; pos >= 1; pos--) {
    const pt = b.points.find((p) => p.position.clockwise === pos)!
    arrCW.push(pt.checkers.filter((c) => c.color === cw.color).length)
  }
  const barCCW =
    b.bar.clockwise.checkers.filter((c) => c.color === ccw.color).length +
    b.bar.counterclockwise.checkers.filter((c) => c.color === ccw.color).length
  const barCW =
    b.bar.clockwise.checkers.filter((c) => c.color === cw.color).length +
    b.bar.counterclockwise.checkers.filter((c) => c.color === cw.color).length
  return { arrCCW, barCCW, arrCW, barCW, ccwColor: ccw.color, cwColor: cw.color }
}

function firstHitOrAnyMove(
  moving: BackgammonGameMoving
): BackgammonMoveSkeleton | undefined {
  // Collect all possible moves across the ready dice
  const moves: BackgammonMoveSkeleton[] = []
  for (const m of Array.from(moving.activePlay.moves)) {
    if (m.stateKind !== 'ready') continue
    const pm = Board.getPossibleMoves(
      moving.board,
      moving.activePlay.player,
      m.dieValue
    ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
    moves.push(...(Array.isArray(pm) ? pm : pm.moves))
  }
  // Prefer hits
  const hit = moves.find((mv) => {
    const dest = mv.destination
    return (
      dest.kind === 'point' &&
      dest.checkers.length === 1 &&
      dest.checkers[0].color !== moving.activePlayer.color
    )
  })
  return hit || moves[0]
}

async function main() {
  // Setup: GNU white (clockwise) vs Nodots black (counterclockwise)
  const white = Player.initialize('white', 'clockwise', 'rolling-for-start', true)
  const black = Player.initialize(
    'black',
    'counterclockwise',
    'rolling-for-start',
    true
  )
  let game: BackgammonGame = Game.initialize(
    [white, black] as any,
    undefined,
    'rolling-for-start'
  )
  game = Game.rollForStart(game as any) as any

  let turns = 0
  const maxTurns = 200
  while (turns < maxTurns) {
    turns++
    // Advance to moving state
    if (game.stateKind === 'rolled-for-start') {
      game = Game.roll(game as any) as any
    }
    if (game.stateKind === 'rolling') {
      game = Game.roll(game as any) as any
    }
    if (game.stateKind !== 'moving') {
      // If still not moving, retry next turn
      continue
    }

    // Execute up to two moves
    let movingGame: BackgammonGameMoving | any = game
    for (let i = 0; i < 2 && movingGame.stateKind === 'moving'; i++) {
      const mv = firstHitOrAnyMove(movingGame)
      if (!mv) break
      const origin = mv.origin
      // Execute via container origin to keep IDs fresh
      const result = Game.executeAndRecalculate(
        movingGame as any,
        origin.id
      ) as any
      movingGame = result
      if (anyBarCheckers(movingGame)) {
        const pid = exportToGnuPositionId(movingGame as any)
        const { arrCCW, barCCW, arrCW, barCW, ccwColor, cwColor } = count24to1(
          movingGame as any
        )
        console.log('Found bar-entry position at turn', turns)
        console.log('GPID:', pid)
        console.log('CCW (GNUBG white) color:', ccwColor)
        console.log('  24→1:', arrCCW.join(','), 'Bar:', barCCW)
        console.log('CW  (GNUBG black) color:', cwColor)
        console.log('  24→1:', arrCW.join(','), 'Bar:', barCW)

        // Try GNUBG CLI if available
        const ver = spawnSync('gnubg', ['--version'], { encoding: 'utf-8' })
        if (ver.status === 0) {
          const dice = movingGame.activePlayer.dice.currentRoll as [number, number]
          const cmds = [
            `new game`,
            `set board ${pid}`,
            `show position`,
            `set dice ${dice[0]} ${dice[1]}`,
            'hint',
            'quit',
          ]
          console.log('\n--- GNUBG CLI ---')
          const proc = spawnSync('gnubg', ['-t'], {
            input: cmds.join('\n'),
            encoding: 'utf-8',
          })
          process.stdout.write(proc.stdout || '')
          process.stderr.write(proc.stderr || '')
          console.log('--- END GNUBG ---')
        } else {
          console.log('GNUBG not found; skipping CLI check')
        }
        return
      }
    }

    // Confirm turn if moved
    if (movingGame.stateKind === 'moved') {
      game = Game.confirmTurn(movingGame as any) as any
    } else {
      game = movingGame
    }
  }
  console.log('Did not encounter bar-entry within', maxTurns, 'turns')
}

main().catch((e) => {
  console.error('simulateUntilBar error:', e?.message || String(e))
})

import {
  BackgammonGameMoving,
  BackgammonGameMoved,
  BackgammonGameRollingForStart,
  BackgammonMoveSkeleton,
} from '@nodots-llc/backgammon-types'
import { Board, Game, Player } from '..'
import {
  initializeGnubgHints,
  configureGnubgHints,
  getMoveHints as getGnuMoveHints,
  buildHintContextFromGame,
  getNormalizedPosition,
  getContainerKind,
} from '@nodots-llc/backgammon-ai'

function checkWin(board: any): 'white' | 'black' | null {
  if (!board || !board.off) return null
  const whiteOff = board.off.clockwise?.checkers?.filter((c: any) => c.color === 'white')?.length || 0
  const blackOff = board.off.counterclockwise?.checkers?.filter((c: any) => c.color === 'black')?.length || 0
  if (whiteOff === 15) return 'white'
  if (blackOff === 15) return 'black'
  return null
}

async function simulateGnuVsGnu(
  maxTurns = 400,
  quiet = true,
  opts?: { swapDirections?: boolean }
): Promise<{ winner: 'white' | 'black' | null; firstMover: 'white' | 'black' }> {
  // Initialize two robot players
  const swap = opts?.swapDirections || process.argv.includes('--swap-directions') || process.env.NODOTS_SWAP_DIRECTIONS === '1'
  const whiteDir = swap ? 'counterclockwise' : 'clockwise'
  const blackDir = swap ? 'clockwise' : 'counterclockwise'
  const white = Player.initialize('white', whiteDir, 'rolling-for-start', true)
  const black = Player.initialize('black', blackDir, 'rolling-for-start', true)
  const players = [white, black] as [typeof white, typeof black]

  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let turn = 0

  // Roll for start
  let state: any = Game.rollForStart(game)
  const firstMover: 'white' | 'black' = state.activeColor

  if (!quiet) console.log('GNU vs GNU Backgammon (fast, textual output)\n')

  while (turn < maxTurns) {
    turn++
    // Roll dice into moving state
    const rolled = Game.roll(state)
    let moving: BackgammonGameMoving | BackgammonGameMoved = rolled
    const rollTuple = rolled.activePlayer.dice.currentRoll as [number, number]
    if (!quiet) console.log(`Turn ${turn}: ${rolled.activeColor} rolls [${rollTuple.join(', ')}]`)

    try {
      await initializeGnubgHints()
      await configureGnubgHints({ evalPlies: 1, moveFilter: 1, usePruning: true })
      const { request, normalization } = buildHintContextFromGame(rolled as any)
      request.dice = [rollTuple[0], rollTuple[1]]
      let hints = await getGnuMoveHints(request, 1)
      if (!hints || hints.length === 0 || !hints[0].moves || hints[0].moves.length === 0) {
        // try swapped dice
        request.dice = [rollTuple[1], rollTuple[0]]
        hints = await getGnuMoveHints(request, 1)
      }

      // Execute moves until completion using hint mapping each time
      let moveCount = 0
      while (moving.stateKind === 'moving') {
        const readyMoves = Array.from(moving.activePlay.moves).filter(
          (m: any) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)
        )
        if (readyMoves.length === 0) break

        // Map top hint step to a possible move for one die
        let chosenDie: number | undefined
        let selectedOrigin: any
        let possibleMoves: BackgammonMoveSkeleton[] = []
        const top = hints && hints[0] && hints[0].moves && hints[0].moves[0]
        if (top) {
          const primaryFrame = normalization.toGnu[(moving.activePlayer as any).color as 'white' | 'black'] as 'white' | 'black'
          const frames: Array<'white' | 'black'> = primaryFrame === 'white' ? ['white', 'black'] : ['black', 'white']
          outer: for (const m of readyMoves) {
            const dv = (m as any).dieValue as number
            const pm = Board.getPossibleMoves(
              (moving as any).board,
              (moving as any).activePlay.player,
              dv as any
            ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
            const arr = Array.isArray(pm) ? pm : pm.moves
            for (const mv of arr) {
              const fromKind = getContainerKind(mv.origin as any)
              const toKind = getContainerKind(mv.destination as any)
              for (const frame of frames) {
                const from = getNormalizedPosition(mv.origin as any, frame)
                const to = getNormalizedPosition(mv.destination as any, frame)
                if (from === null || to === null) continue
                if (
                  top.from === from &&
                  top.to === to &&
                  top.fromContainer === fromKind &&
                  top.toContainer === toKind
                ) {
                  chosenDie = dv
                  selectedOrigin = (mv as any).origin
                  possibleMoves = arr
                  break outer
                }
              }
            }
          }
        }

        if (!chosenDie) {
          // fallback: pick any legal move
          const m = readyMoves[0] as any
          const pm = Board.getPossibleMoves(
            (moving as any).board,
            (moving as any).activePlay.player,
            (m as any).dieValue as any
          ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
          const arr = Array.isArray(pm) ? pm : pm.moves
          if (arr.length > 0) {
            chosenDie = (m as any).dieValue
            possibleMoves = arr
            selectedOrigin = (arr[0] as any).origin
          }
        }

        if (!chosenDie || !selectedOrigin) break
        const originChecker = (selectedOrigin as any).checkers.find(
          (c: any) => c.color === (moving as any).activeColor
        )
        if (!originChecker) break
        const moved = Game.move(moving as BackgammonGameMoving, originChecker.id)
        moveCount++
        if ((moved as any).stateKind === 'moved') {
          moving = moved as BackgammonGameMoved
          break
        } else if ('board' in moved) {
          moving = moved as BackgammonGameMoving
        } else {
          break
        }
      }

      // Complete no-move/completion
      if (moving.stateKind === 'moving') {
        const completed = Game.checkAndCompleteTurn(moving as BackgammonGameMoving)
        moving = completed as any
      }

      // Winner check by off piles
      const wByOff = checkWin((moving as any).board || rolled.board)
      if (wByOff) {
        if (!quiet) console.log(`\nWinner: ${wByOff}`)
        return { winner: wByOff, firstMover }
      }

      // Turn handling
      if ((moving as any).stateKind === 'moved') {
        const allMoves = Array.from((moving as any).activePlay.moves)
        const exec = allMoves.filter((m: any) => m.stateKind === 'completed' && m.moveKind !== 'no-move')
        if (!quiet) console.log(`  Executed ${exec.length} moves`)
        state = Game.confirmTurn(moving as BackgammonGameMoved)
      } else {
        state = moving
      }
    } catch (e) {
      if (!quiet) console.error('Simulation error:', e)
      return { winner: null, firstMover }
    }
  }
  if (!quiet) console.log('\nReached max turns without winner')
  return { winner: null, firstMover }
}

if (require.main === module) {
  const swap = process.argv.includes('--swap-directions')
  simulateGnuVsGnu(200, false, { swapDirections: swap }).then((res) => {
    // noop
  }).catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

export { simulateGnuVsGnu }

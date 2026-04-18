/**
 * Run 5 games between Nodots Bot (1-ply) and GNU Beginner (1-ply)
 *
 * Skill configs from database:
 * - Nodots Bot: {"noise": 0, "evalPlies": 1, "moveFilter": 0, "skillLevel": "novice", "usePruning": true}
 * - GNU Beginner: {"noise": 0, "evalPlies": 1, "moveFilter": 1, "skillLevel": "beginner", "usePruning": true}
 */
import type {
  BackgammonGameMoving,
  BackgammonGameMoved,
  BackgammonGameRollingForStart,
  BackgammonMoveSkeleton,
} from '@nodots/backgammon-types'
import { Board, Game, Player } from '../index.js'
import {
  initializeGnubgHints,
  configureGnubgHints,
  getMoveHints as getGnuMoveHints,
  buildHintContextFromGame,
  getNormalizedPosition,
  getContainerKind,
} from '@nodots/backgammon-ai'
import { MoveFilterSetting } from '@nodots/gnubg-hints'
import { PerformanceRatingCalculator } from '../Services/PerformanceRatingCalculator.js'

// Skill configs from the database
const NODOTS_BOT_CONFIG = { evalPlies: 1, moveFilter: 0, noise: 0, usePruning: true }
const GNU_BEGINNER_CONFIG = { evalPlies: 1, moveFilter: 1, noise: 0, usePruning: true }

interface GameResult {
  gameNum: number
  winner: string
  whitePR: number | null
  blackPR: number | null
  whiteErrors: { veryBad: number; blunders: number; errors: number }
  blackErrors: { veryBad: number; blunders: number; errors: number }
}

async function runGame(gameNum: number): Promise<GameResult> {
  console.log(`\n=== Game ${gameNum} ===`)

  // White = Nodots Bot (1-ply, moveFilter 0)
  // Black = GNU Beginner (1-ply, moveFilter 1)
  const white = Player.initialize('white', 'clockwise', 'rolling-for-start', true)
  const black = Player.initialize('black', 'counterclockwise', 'rolling-for-start', true)
  const players = [white, black] as [typeof white, typeof black]

  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let state: any = Game.rollForStart(game)

  let turn = 0
  const maxTurns = 400

  while (state.stateKind !== 'completed' && turn < maxTurns) {
    turn++

    // Roll dice
    const rolled = Game.roll(state)
    let moving: BackgammonGameMoving | BackgammonGameMoved = rolled
    const rollTuple = rolled.activePlayer.dice.currentRoll as [number, number]
    const isWhite = rolled.activeColor === 'white'

    // Configure GNU based on which robot is playing
    const config = isWhite ? NODOTS_BOT_CONFIG : GNU_BEGINNER_CONFIG
    await initializeGnubgHints()
    await configureGnubgHints({
      evalPlies: config.evalPlies,
      moveFilter: config.moveFilter,
      usePruning: config.usePruning,
    })

    try {
      const { request } = buildHintContextFromGame(rolled as any)
      request.dice = [rollTuple[0], rollTuple[1]]
      let hints = await getGnuMoveHints(request, 1)
      const altReq = { ...request, dice: [rollTuple[1], rollTuple[0]] as [number, number] }
      const altHints = (!hints || hints.length === 0 || !hints[0].moves?.length)
        ? await getGnuMoveHints(altReq, 1)
        : await getGnuMoveHints(altReq, 1).catch(() => [])

      let hintSeq = (hints && hints[0] && Array.isArray(hints[0].moves)) ? hints[0].moves : []
      const hintSeqAlt = (altHints && altHints[0] && Array.isArray(altHints[0].moves)) ? altHints[0].moves : []
      let stepIndex = 0

      while (moving.stateKind === 'moving') {
        const readyMoves = Array.from(moving.activePlay.moves).filter(
          (m: any) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)
        )
        if (readyMoves.length === 0) break

        let selectedOrigin: any = null
        const direction = (moving.activePlayer as any).direction as 'clockwise' | 'counterclockwise'

        const tryMap = (target: any): boolean => {
          for (const m of readyMoves) {
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
              const fromPos = fromKind === 'point' ? getNormalizedPosition(mv.origin as any, direction) : (fromKind === 'bar' ? 25 : 0)
              const toPos = toKind === 'point' ? getNormalizedPosition(mv.destination as any, direction) : (toKind === 'off' ? 0 : 25)
              if (target.from === fromPos && target.to === toPos) {
                selectedOrigin = mv.origin
                return true
              }
            }
          }
          return false
        }

        const targetHint = hintSeq[stepIndex]
        if (targetHint) tryMap(targetHint)
        if (!selectedOrigin && hintSeqAlt[stepIndex]) tryMap(hintSeqAlt[stepIndex])

        // Fallback: pick first ready move's first possible origin
        if (!selectedOrigin && readyMoves.length > 0) {
          const m = readyMoves[0] as any
          const pm = Board.getPossibleMoves(
            (moving as any).board,
            (moving as any).activePlay.player,
            m.dieValue as any
          ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
          const arr = Array.isArray(pm) ? pm : pm.moves
          if (arr.length > 0) {
            selectedOrigin = arr[0].origin
          }
        }

        if (!selectedOrigin) break

        // Find a checker of the active color at the origin
        const originChecker = (selectedOrigin as any).checkers?.find(
          (c: any) => c.color === (moving as any).activeColor
        )
        if (!originChecker) break

        // Execute the move using the checker ID
        const next = Game.move(moving as any, originChecker.id)
        stepIndex++

        if ((next as any).stateKind === 'moved') {
          moving = next as BackgammonGameMoved
          break
        } else if ((next as any).stateKind === 'moving') {
          moving = next as BackgammonGameMoving
        } else {
          break
        }
      }

      state = Game.confirmTurn(moving as any)

    } catch (err) {
      console.log(`Error in game ${gameNum} turn ${turn}: ${err}`)
      break
    }
  }

  if (state.stateKind !== 'completed') {
    console.log(`Game ${gameNum} did not complete after ${turn} turns`)
    return {
      gameNum,
      winner: 'incomplete',
      whitePR: null,
      blackPR: null,
      whiteErrors: { veryBad: 0, blunders: 0, errors: 0 },
      blackErrors: { veryBad: 0, blunders: 0, errors: 0 }
    }
  }

  const winner = state.players.find((p: any) => p.stateKind === 'winner')
  const winnerName = winner?.color === 'white' ? 'Nodots Bot' : 'GNU Beginner'
  console.log(`Winner: ${winnerName} (${turn} turns)`)

  // Calculate PRs using the full game history
  // Reconfigure GNU to default (2-ply) for fair PR calculation
  await configureGnubgHints({ evalPlies: 2, moveFilter: MoveFilterSetting.Large, usePruning: true })

  const prCalc = new PerformanceRatingCalculator()
  let whitePR: number | null = null
  let blackPR: number | null = null
  let whiteErrors = { veryBad: 0, blunders: 0, errors: 0 }
  let blackErrors = { veryBad: 0, blunders: 0, errors: 0 }

  try {
    const whiteResult = await prCalc.calculateForPlayer(state, white.userId)
    whitePR = whiteResult.performanceRating
    whiteErrors = {
      veryBad: whiteResult.errors.veryBad,
      blunders: whiteResult.errors.blunder,
      errors: whiteResult.errors.error
    }
    console.log(`Nodots Bot PR: ${whitePR.toFixed(2)}, Errors: ${whiteErrors.veryBad}vb/${whiteErrors.blunders}bl/${whiteErrors.errors}er`)
  } catch (e) {
    console.log(`Failed to calculate white PR: ${e}`)
  }

  try {
    const blackResult = await prCalc.calculateForPlayer(state, black.userId)
    blackPR = blackResult.performanceRating
    blackErrors = {
      veryBad: blackResult.errors.veryBad,
      blunders: blackResult.errors.blunder,
      errors: blackResult.errors.error
    }
    console.log(`GNU Beginner PR: ${blackPR.toFixed(2)}, Errors: ${blackErrors.veryBad}vb/${blackErrors.blunders}bl/${blackErrors.errors}er`)
  } catch (e) {
    console.log(`Failed to calculate black PR: ${e}`)
  }

  return {
    gameNum,
    winner: winnerName,
    whitePR,
    blackPR,
    whiteErrors,
    blackErrors
  }
}

async function main() {
  console.log('Running 5 games: Nodots Bot vs GNU Beginner')
  console.log('Nodots Bot (white): evalPlies=1, moveFilter=0')
  console.log('GNU Beginner (black): evalPlies=1, moveFilter=1')
  console.log('')

  const results: GameResult[] = []

  for (let i = 1; i <= 5; i++) {
    const result = await runGame(i)
    results.push(result)
  }

  console.log('\n========== SUMMARY ==========')
  console.log('Game | Winner       | NodotsPR  | BeginnerPR | Nodots Err | Beginner Err')
  console.log('-----|--------------|-----------|------------|------------|-------------')

  for (const r of results) {
    const wPR = r.whitePR !== null ? r.whitePR.toFixed(2) : 'N/A'
    const bPR = r.blackPR !== null ? r.blackPR.toFixed(2) : 'N/A'
    const wErr = `${r.whiteErrors.veryBad}/${r.whiteErrors.blunders}/${r.whiteErrors.errors}`
    const bErr = `${r.blackErrors.veryBad}/${r.blackErrors.blunders}/${r.blackErrors.errors}`
    console.log(`  ${r.gameNum}  | ${r.winner.padEnd(12)} | ${wPR.padStart(9)} | ${bPR.padStart(10)} | ${wErr.padStart(10)} | ${bErr}`)
  }

  const nodotsBotWins = results.filter(r => r.winner === 'Nodots Bot').length
  const gnuBeginnerWins = results.filter(r => r.winner === 'GNU Beginner').length
  const validWhite = results.filter(r => r.whitePR !== null)
  const validBlack = results.filter(r => r.blackPR !== null)
  const avgWhitePR = validWhite.length > 0 ? validWhite.reduce((sum, r) => sum + r.whitePR!, 0) / validWhite.length : 0
  const avgBlackPR = validBlack.length > 0 ? validBlack.reduce((sum, r) => sum + r.blackPR!, 0) / validBlack.length : 0

  console.log('\nTotals:')
  console.log(`  Nodots Bot wins: ${nodotsBotWins}`)
  console.log(`  GNU Beginner wins: ${gnuBeginnerWins}`)
  console.log(`  Avg Nodots Bot PR: ${avgWhitePR.toFixed(2)}`)
  console.log(`  Avg GNU Beginner PR: ${avgBlackPR.toFixed(2)}`)

  console.log('\nNote: Both robots use evalPlies=1. The only difference is moveFilter (0 vs 1).')
  console.log('PRs are calculated at 2-ply for fair comparison to optimal play.')
}

main().catch(console.error)

import type {
  BackgammonGameMoving,
  BackgammonGameMoved,
  BackgammonGameRollingForStart,
  BackgammonMoveSkeleton,
  BackgammonCheckerContainer,
  BackgammonGame,
} from '@nodots-llc/backgammon-types'
import { Game, Board, Player } from '..'
import {
  initializeGnubgHints,
  configureGnubgHints,
  getMoveHints as getGnuMoveHints,
  buildHintContextFromGame,
  getNormalizedPosition,
  getContainerKind,
  shutdownGnubgHints,
} from '@nodots-llc/backgammon-ai'
import { MoveFilterSetting } from '@nodots-llc/gnubg-hints'
import { PerformanceRatingCalculator } from '../Services/PerformanceRatingCalculator'

const SIMPLE_REPLAY = process.env.NODOTS_PR_REPLAY_SIMPLE === '1'

function getPosFromOwnerDir(container: BackgammonCheckerContainer | undefined, ownerDirection: 'clockwise' | 'counterclockwise'): number {
  if (!container) return 0
  if (container.kind === 'bar' || container.kind === 'off') return 0
  if (container.kind === 'point') {
    const pos = (container.position as any)?.[ownerDirection]
    return typeof pos === 'number' ? pos : 0
  }
  return 0
}

function parseArg(name: string, def: number) {
  const arg = process.argv.find((a) => a.startsWith(`--${name}=`))
  if (!arg) return def
  const v = parseInt(arg.split('=')[1] || '', 10)
  return Number.isFinite(v) ? v : def
}

async function simulateOne(gameIndex: number): Promise<{
  gameId: string
  gameStates: BackgammonGame[]
  moveActions: Array<{ player: string; move: any; dice?: number[] }>
}> {
  const white = Player.initialize('white', 'clockwise', 'rolling-for-start', true)
  const black = Player.initialize('black', 'counterclockwise', 'rolling-for-start', true)
  const players = [white, black] as [typeof white, typeof black]

  let game = Game.initialize(players) as BackgammonGameRollingForStart
  let state: any = Game.rollForStart(game)

  const gameStates: BackgammonGame[] = []
  const moveActions: Array<{ player: string; move: any; dice?: number[] }> = []
  const gameId = `sim-${gameIndex}`

  // play until completion or max turns
  for (let turn = 0; turn < 400; turn++) {
    // Roll to get moving state
    const rolled = Game.roll(state)
    let moving: BackgammonGameMoving | BackgammonGameMoved = rolled
    const rollTuple = (rolled as any).activePlayer?.dice?.currentRoll as [number, number]

    // Fetch hints with executed dice then swapped if needed
    await initializeGnubgHints()
    const cfgEvalPlies = parseInt(process.env.NODOTS_GNUBG_EVAL_PLIES || String(parseArg('evalPlies', 2)), 10)
    const cfgMoveFilter = parseInt(
      process.env.NODOTS_GNUBG_MOVE_FILTER || String(parseArg('moveFilter', MoveFilterSetting.Large)),
      10
    )
    const cfgPruning = (process.env.NODOTS_GNUBG_PRUNING ?? 'true') === 'true'
    await configureGnubgHints({ evalPlies: cfgEvalPlies, moveFilter: cfgMoveFilter, usePruning: cfgPruning })
    const { request } = buildHintContextFromGame(rolled as any)
    request.dice = [rollTuple?.[0] ?? 0, rollTuple?.[1] ?? 0]
    let hints = await getGnuMoveHints(request, 1)
    const altReq = { ...request, dice: [rollTuple?.[1] ?? 0, rollTuple?.[0] ?? 0] as [number, number] }
    const altHints = (!hints || hints.length === 0 || !hints[0].moves?.length)
      ? await getGnuMoveHints(altReq, 1)
      : await getGnuMoveHints(altReq, 1).catch(() => [])

    // Record pre-turn state once (deep clone) so indices align for the first action
    const turnStartState = JSON.parse(JSON.stringify(rolled)) as BackgammonGame
    const activePlayerId: string = (rolled as any).activePlayer?.id || (rolled as any).activePlayer?.userId

    // Execute steps until turn completes
    let movesExecuted = 0
    let hintSeq = (hints && hints[0] && Array.isArray(hints[0].moves)) ? hints[0].moves : []
    const hintSeqAlt = (altHints && altHints[0] && Array.isArray(altHints[0].moves)) ? altHints[0].moves : []
    let stepIndex = 0
    while ((moving as any).stateKind === 'moving') {
      const readyMoves = Array.from((moving as any).activePlay.moves).filter(
        (m: any) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)
      )
      if (readyMoves.length === 0) break

      let chosenDie: number | undefined
      let selectedOrigin: any
      let possibleMoves: BackgammonMoveSkeleton[] = []

      const direction = (moving as any).activePlayer?.direction as 'clockwise' | 'counterclockwise'
      const primaryFrame: 'clockwise' | 'counterclockwise' = direction
      const opponentFrame: 'clockwise' | 'counterclockwise' =
        primaryFrame === 'clockwise' ? 'counterclockwise' : 'clockwise'
      const target = (stepIndex < hintSeq.length) ? hintSeq[stepIndex] : undefined
      if (target) {
        const nextTarget = (stepIndex + 1 < hintSeq.length) ? hintSeq[stepIndex + 1] : undefined

        const tryCollectCandidates = (
          tgt: any,
          frames: Array<'clockwise' | 'counterclockwise'>
        ) => {
          const cands: Array<{ dv: number; origin: any; arr: BackgammonMoveSkeleton[] }> = []
          for (const m of readyMoves) {
            const dv = (m as any).dieValue as number
            const pm = Board.getPossibleMoves(
              (moving as any).board,
              (moving as any).activePlay.player,
              dv as any,
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
                  tgt.from === from &&
                  tgt.to === to &&
                  tgt.fromContainer === fromKind &&
                  tgt.toContainer === toKind
                ) {
                  cands.push({ dv, origin: (mv as any).origin, arr })
                  break
                }
              }
            }
          }
          // Limit width to reduce memory/branching
          return SIMPLE_REPLAY ? cands.slice(0, 1) : cands.slice(0, 2)
        }

        // Multi-step lookahead: shallow depth 1 to limit memory (disabled in SIMPLE mode)
        const tryLookaheadDepth = (
          baseState: any,
          hintSeqUse: any[],
          idx: number,
          maxDepth: number,
        ): number => {
          if (SIMPLE_REPLAY) return 0
          if (idx >= hintSeqUse.length || maxDepth === 0) return 0
          const tgt = hintSeqUse[idx]
          const primary = (baseState.activePlayer as any).direction as 'clockwise' | 'counterclockwise'
          const rdy = Array.from((baseState as any).activePlay.moves).filter(
            (m: any) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)
          )
          // Collect candidates at this state
          const candidatesNow: Array<{ origin: any; nextState: any }> = []
          for (const m of rdy) {
            const dv = (m as any).dieValue as number
            const pm = Board.getPossibleMoves((baseState as any).board, (baseState as any).activePlay.player, dv as any) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
            const arr = Array.isArray(pm) ? pm : pm.moves
            for (const mv of arr) {
              const fromKind = getContainerKind(mv.origin as any)
              const toKind = getContainerKind(mv.destination as any)
              const from = getNormalizedPosition(mv.origin as any, primary)
              const to = getNormalizedPosition(mv.destination as any, primary)
              if (from === null || to === null) continue
              if (
                tgt.from === from && tgt.to === to && tgt.fromContainer === fromKind && tgt.toContainer === toKind
              ) {
                const originChecker = (mv.origin as any).checkers.find((c: any) => c.color === (baseState as any).activeColor)
                if (!originChecker) continue
                const branched = Game.move(baseState as any, originChecker.id)
                if ((branched as any)?.stateKind !== 'moving') continue
                candidatesNow.push({ origin: mv.origin, nextState: branched })
              }
            }
          }
          if (candidatesNow.length === 0) return 0
          // Only consider first two to limit width
          let best = 0
          for (const cand of candidatesNow.slice(0, 2)) {
            const score = 1 + tryLookaheadDepth(cand.nextState, hintSeqUse, idx + 1, 0)
            if (score > best) best = score
          }
          return best
        }

        // Primary candidates for current step
        let candidates = tryCollectCandidates(target, [primaryFrame])
        // If none, try alternate dice sequence at this same step
        if (candidates.length === 0 && hintSeqAlt.length > stepIndex) {
          const altTargetNow = hintSeqAlt[stepIndex]
          const altCands = tryCollectCandidates(altTargetNow, [primaryFrame])
          if (altCands.length > 0) {
            hintSeq = hintSeqAlt
            candidates = altCands
          }
        }
        // If still none, try opponent frame
        if (candidates.length === 0) candidates = tryCollectCandidates(target, [opponentFrame])

        if (candidates.length > 0) {
          if (SIMPLE_REPLAY) {
            // Pick first candidate deterministically
            chosenDie = candidates[0].dv
            selectedOrigin = candidates[0].origin
          } else {
            // Choose candidate with best 2-step prefix score
            let bestPick = candidates[0]
            let bestScore = -1
            for (const cand of candidates) {
              const originChecker = (cand.origin as any).checkers.find((c: any) => c.color === (moving as any).activeColor)
              if (!originChecker) continue
              const branched = Game.move(moving as any, originChecker.id, cand.dv as any)
              if ((branched as any)?.stateKind !== 'moving') {
                bestPick = cand
                bestScore = Math.max(bestScore, 1)
                continue
              }
              const score = 1 + tryLookaheadDepth(branched, hintSeq, stepIndex + 1, 1)
              if (score > bestScore) {
                bestScore = score
                bestPick = cand
              }
            }
            chosenDie = bestPick.dv
            selectedOrigin = bestPick.origin
          }
        }
      }

      if (!chosenDie) {
        const m = readyMoves[0] as any
        const pm = Board.getPossibleMoves(
          (moving as any).board,
          (moving as any).activePlay.player,
          (m as any).dieValue as any,
        ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
        const arr = Array.isArray(pm) ? pm : pm.moves
        if (arr.length > 0) {
          chosenDie = (m as any).dieValue
          possibleMoves = arr
          selectedOrigin = (arr[0] as any).origin
        }
      }

      if (!chosenDie || !selectedOrigin) break

      // Execute by moving the checker from selected origin
      const originChecker = (selectedOrigin as any).checkers.find(
        (c: any) => c.color === (moving as any).activeColor,
      )
      if (!originChecker) break
      // Avoid large deep clones per step to reduce memory
      // Prefer die targeted by current step when executing the move
      const roll = (moving as any).activePlayer?.dice?.currentRoll as [number, number]
      const otherDie = (roll && roll[0] !== roll[1]) ? (roll[0] === chosenDie ? roll[1] : roll[0]) : chosenDie
      try {
        // Use Play.planMoveExecution bias by directly calling Player.move with origin id
        const next = Game.move(moving as any, originChecker.id, chosenDie as any)
        movesExecuted++
        if (target) stepIndex++
        if ((next as any).stateKind === 'moved') {
          moving = next as BackgammonGameMoved
          break
        } else if ('board' in (next as any)) {
          moving = next as BackgammonGameMoving
        } else {
          break
        }
      } catch {
        // Fallback: still attempt move
        const next = Game.move(moving as any, originChecker.id, chosenDie as any)
        movesExecuted++
        if (target) stepIndex++
        if ((next as any).stateKind === 'moved') {
          moving = next as BackgammonGameMoved
          break
        } else if ('board' in (next as any)) {
          moving = next as BackgammonGameMoving
        } else {
          break
        }
      }
    }

    // Complete turn and collect executed move details
    if ((moving as any).stateKind === 'moving') {
      moving = Game.checkAndCompleteTurn(moving as BackgammonGameMoving) as any
    }

    const allMoves = Array.from((moving as any).activePlay.moves)
    const exec = allMoves.filter((m: any) => m.stateKind === 'completed' && m.moveKind !== 'no-move')

    // For each executed move, append an action and a state entry.
    for (let k = 0; k < exec.length; k++) {
      const cm = exec[k] as any
      const player = (cm.player?.id || cm.player?.userId) as string
      const dir = cm.player?.direction as 'clockwise' | 'counterclockwise'
      const originPos = cm.origin ? getPosFromOwnerDir(cm.origin as any, dir) : (cm.moveKind === 'reenter' ? 0 : 0)
      const destPos = cm.destination ? getPosFromOwnerDir(cm.destination as any, dir) : (cm.moveKind === 'bear-off' ? 0 : 0)
      const movePayload = {
        originPosition: originPos,
        destinationPosition: destPos,
        moveKind: cm.moveKind,
        isHit: !!cm.isHit,
        dieValue: cm.dieValue,
      }
      // Use the turn-start state for each step to reduce memory footprint (acceptable for PR replay heuristics)
      gameStates.push(turnStartState)
      moveActions.push({ player, move: movePayload, dice: [rollTuple?.[0] ?? 0, rollTuple?.[1] ?? 0] })
    }

    // Winner check by off piles or game state
    if ((moving as any).stateKind === 'moved') {
      const completedState = Game.confirmTurn(moving as BackgammonGameMoved)
      state = completedState
    } else {
      // Could not transition to moved (e.g., no-move turn); keep current state
      state = moving as any
    }
    if ((state as any).stateKind === 'completed') break
  }

  return { gameId, gameStates, moveActions }
}

async function main() {
  const games = parseArg('games', 10)
  const batchSize = Math.max(1, parseArg('batchSize', Math.min(20, games)))
  const calculator = new PerformanceRatingCalculator()
  let totalRank1 = 0
  let totalRank2 = 0
  let totalRank3p = 0
  let totalFinalBoard = 0
  let totalMovesAnalyzed = 0
  const prValues: number[] = []

  let idx = 0
  while (idx < games) {
    const end = Math.min(games, idx + batchSize)
    for (let i = idx; i < end; i++) {
      const { gameId, gameStates, moveActions } = await simulateOne(i + 1)
      const pr = await calculator.calculateGamePR(gameId, gameStates, moveActions)
      const players = Object.values(pr.playerResults)
      for (const p of players) {
        totalRank1 += p.matchedRank1 ?? 0
        totalRank2 += p.matchedRank2 ?? 0
        totalRank3p += p.matchedRank3Plus ?? 0
        totalFinalBoard += (p as any).matchFinalBoard ?? 0
        totalMovesAnalyzed += p.analyzedMoves
        if (typeof p.performanceRating === 'number') prValues.push(p.performanceRating)
      }
    }
    // Attempt to free native resources between batches
    try { await shutdownGnubgHints() } catch {}
    idx = end
  }

  console.log('\n=== GNU vs GNU PR Replay Summary ===')
  console.log(`Games: ${games}`)
  console.log(`Analyzed moves: ${totalMovesAnalyzed}`)
  console.log(`Rank1 matches: ${totalRank1}`)
  console.log(`Rank2 matches: ${totalRank2}`)
  console.log(`Rank3+ matches: ${totalRank3p}`)
  console.log(`Final-board matches (doubles): ${totalFinalBoard}`)

  if (prValues.length > 0) {
    const sum = prValues.reduce((a, b) => a + b, 0)
    const avg = sum / prValues.length
    const min = Math.min(...prValues)
    const max = Math.max(...prValues)
    const variance = prValues.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / prValues.length
    const stddev = Math.sqrt(variance)
    console.log(`Average PR: ${avg.toFixed(2)} (min ${min.toFixed(2)}, max ${max.toFixed(2)}, sd ${stddev.toFixed(2)})`)
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e)
    process.exit(1)
  })
}

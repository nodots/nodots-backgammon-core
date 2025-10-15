import {
  BackgammonGameMoved,
  BackgammonGameMoving,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonMove,
  BackgammonMoveOrigin,
  BackgammonMoveSkeleton,
} from '@nodots-llc/backgammon-types'
import { Board, Game, Player } from '..'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import { logger } from '../utils/logger'

// Mapping debug flag: enable with `npm run simulate -- --mapping-debug`
const MAPPING_DEBUG = process.argv.includes('--mapping-debug')

interface SimulationStats {
  totalTurns: number
  totalMoves: number // includes no-move (dice used)
  executedMoves: number // checker movements only
  noMoves: number // number of completed no-move entries
  whiteCheckersOff: number
  blackCheckersOff: number
}

function displayTurnInfo(
  turnNumber: number,
  activeColor: string,
  roll: number[],
  activeLabel: string
) {
  const message = `\n=== Turn ${turnNumber} (${activeLabel}) ===\n\n${activeColor}'s roll: ${roll.join(
    ', '
  )}\n`
  console.log(message)
  logger.info('[Simulation] Turn info:', {
    turnNumber,
    activeColor,
    roll,
    activeLabel,
  })
}

function displayMoveInfo(
  moveNumber: number,
  origin: BackgammonMoveOrigin,
  destination: any
) {
  const originStr = origin.kind === 'point' ? origin.position.clockwise : 'bar'
  const destStr =
    destination.kind === 'point' ? destination.position.clockwise : 'off'
  const message = `Move ${moveNumber}: from ${originStr} to ${destStr}\n`
  console.log(message)
  logger.info('[Simulation] Move info:', {
    moveNumber,
    origin: originStr,
    destination: destStr,
    originKind: origin.kind,
    destinationKind: destination.kind,
  })
}

function getStats(board: any): SimulationStats {
  const whiteOff =
    board.off.clockwise.checkers.filter((c: any) => c.color === 'white')
      .length +
    board.off.counterclockwise.checkers.filter((c: any) => c.color === 'white')
      .length
  const blackOff =
    board.off.clockwise.checkers.filter((c: any) => c.color === 'black')
      .length +
    board.off.counterclockwise.checkers.filter((c: any) => c.color === 'black')
      .length

  return {
    totalTurns: 0, // Will be updated in main function
    totalMoves: 0, // Will be updated in main function
    executedMoves: 0,
    noMoves: 0,
    whiteCheckersOff: whiteOff,
    blackCheckersOff: blackOff,
  }
}

function displayStats(stats: SimulationStats, gnuIsWhite: boolean) {
  const gnuOff = gnuIsWhite ? stats.whiteCheckersOff : stats.blackCheckersOff
  const nodotsOff = gnuIsWhite ? stats.blackCheckersOff : stats.whiteCheckersOff
  const message = `\n=== Simulation Statistics ===
Total Turns: ${stats.totalTurns}
Total Moves (incl. no-move): ${stats.totalMoves}
Executed Checker Moves: ${stats.executedMoves}
No-Moves: ${stats.noMoves}
GNU Checkers Off: ${gnuOff}
Nodots Engine Checkers Off: ${nodotsOff}`
  console.log(message)
  logger.info('[Simulation] Statistics:', { ...stats, gnuIsWhite, gnuOff, nodotsOff })
}

function checkWinCondition(board: any): string | null {
  // A player wins if all their checkers are off the board
  const whiteCheckersOff =
    board.off.clockwise.checkers.filter((c: any) => c.color === 'white')
      .length +
    board.off.counterclockwise.checkers.filter((c: any) => c.color === 'white')
      .length
  const blackCheckersOff =
    board.off.clockwise.checkers.filter((c: any) => c.color === 'black')
      .length +
    board.off.counterclockwise.checkers.filter((c: any) => c.color === 'black')
      .length

  if (whiteCheckersOff === 15) return 'white'
  if (blackCheckersOff === 15) return 'black'
  return null
}

export async function runSimulation(maxTurns: number = 100) {
  // Initialize players
  const whitePlayer = Player.initialize(
    'white',
    'clockwise',
    'rolling-for-start',
    true
  )
  const blackPlayer = Player.initialize(
    'black',
    'counterclockwise',
    'rolling-for-start',
    true
  )
  const players = [whitePlayer, blackPlayer] as [
    typeof whitePlayer,
    typeof blackPlayer
  ]

  // Initialize game
  let game = Game.initialize(players) as BackgammonGameRollingForStart
  // Randomize roles between GNU and Nodots Engine
  const gnuIsWhite = Math.random() < 0.5
  const labels: Record<string, string> = gnuIsWhite
    ? { [whitePlayer.id]: 'GNU', [blackPlayer.id]: 'Nodots Engine' }
    : { [whitePlayer.id]: 'Nodots Engine', [blackPlayer.id]: 'GNU' }
  console.log(
    gnuIsWhite
      ? `Players: GNU (white) vs Nodots Engine (black)\n`
      : `Players: Nodots Engine (white) vs GNU (black)\n`
  )
  let turnCount = 0
  let executedMovesTotal = 0 // actual checker movements
  let diceUsedTotal = 0 // includes no-move
  let noMovesTotal = 0
  let lastBoard = game.board

  // Roll for start
  let gameState: BackgammonGameRolledForStart | BackgammonGameRolling =
    Game.rollForStart(game)
  console.log('Initial board state:')
  logger.info('[Simulation] Initial board state')
  try {
    const ascii = Board.getAsciiGameBoard(
      gameState.board,
      (gameState as any).players,
      (gameState as any).activeColor,
      (gameState as any).stateKind,
      undefined,
      labels
    )
    console.log(ascii)
  } catch {
    Board.displayAsciiBoard(gameState.board)
  }

  // If maxTurns is 0, run until there's a winner
  const shouldRunUntilWinner = maxTurns === 0

  while (shouldRunUntilWinner || turnCount < maxTurns) {
    turnCount++

    // Roll dice from current state
    const gameRolled = Game.roll(gameState)
    const roll = gameRolled.activePlayer.dice.currentRoll
    displayTurnInfo(
      turnCount,
      gameRolled.activeColor,
      roll,
      labels[gameRolled.activePlayer.id] || 'Simple Heuristic'
    )

    // Make moves until no more valid moves are available
    let moveCount = 0
    let gameMoved: BackgammonGameMoving | BackgammonGameMoved = gameRolled

    try {
      while (
        gameMoved.stateKind === 'moving' &&
        Array.from(gameMoved.activePlay.moves).some((m: any) => {
          if (m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)) {
            const pm = Board.getPossibleMoves(gameMoved.board, m.player, m.dieValue) as
              | BackgammonMoveSkeleton[]
              | { moves: BackgammonMoveSkeleton[] }
            const movesArr = Array.isArray(pm) ? pm : pm.moves
            return movesArr.length > 0
          }
          return false
        })
      ) {
        const isGnu = labels[gameMoved.activePlayer.id] === 'GNU'
        let chosenDie: number | undefined
        let possibleMoves: BackgammonMoveSkeleton[] = []
        let selectedOrigin: { id: string; kind: string; checkers: any[] } | undefined
        if (isGnu) {
          // Use GNU Backgammon hints to select origin
          const positionId = exportToGnuPositionId(gameMoved as any)
          await GnuBgHints.initialize()
          GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })
          const rollTuple = gameMoved.activePlayer.dice.currentRoll as [number, number]
          const hints = await GnuBgHints.getHintsFromPositionId(positionId, rollTuple as any)
          if (MAPPING_DEBUG) {
            console.log('[MAPDBG] positionId:', positionId, 'roll:', rollTuple)
          }
          if (!hints || hints.length === 0 || !hints[0].moves || hints[0].moves.length === 0) {
            // Fallback: if GNU cannot provide hints, use Nodots AI for this move
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-ignore
            const aiModule = await import('@nodots-llc/backgammon-ai')
            const best = await aiModule.selectBestMove(gameMoved.activePlay, 'nodots')
            if (!best) {
              throw new Error('GNU hints not available or empty for current position/roll')
            }
            chosenDie = (best as any).dieValue
            possibleMoves = (best as any).possibleMoves && (best as any).possibleMoves.length
              ? (best as any).possibleMoves
              : ((): BackgammonMoveSkeleton[] => {
                  const pm2 = Board.getPossibleMoves(
                    gameMoved.board,
                    (best as any).player,
                    (best as any).dieValue
                  ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                  return Array.isArray(pm2) ? pm2 : pm2.moves
                })()
            selectedOrigin = possibleMoves[0]?.origin as any
          } else {
            // Pick the first move in GNU's preferred sequence that is playable with remaining dice
            const gmSeq = hints[0].moves
            const readyMovesAll = Array.from(gameMoved.activePlay.moves).filter((m: any) => m.stateKind === 'ready')
            let gm = gmSeq[0]
            for (const g of gmSeq) {
              // Temporarily map origin and see if any ready die supports it
              const { direction, color } = gameMoved.activePlayer as any
              const dir = direction as 'clockwise' | 'counterclockwise'
              const points = (gameMoved.board as any).points
              const originCandidate = g.moveKind === 'reenter'
                ? (gameMoved.board as any).bar[dir]
                : points.find((p: any) => p.position[dir] === (g as any).from)
              if (!originCandidate) continue
              if (originCandidate?.checkers?.some((c: any) => c.color === color)) {
                for (const m of readyMovesAll) {
                  const dv = m.dieValue
                  const pm = Board.getPossibleMoves(
                    gameMoved.board,
                    (gameMoved as any).activePlay.player,
                    dv
                  ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                  const movesArr = Array.isArray(pm) ? pm : pm.moves
                  const hasOrigin = movesArr.some((mv: any) => mv.origin?.id === originCandidate.id)
                  if (hasOrigin) {
                    gm = g
                    break
                  }
                }
                if (gm === g) break
              }
            }
            // Map GNU origin/destination using the active player's own direction only
            const { direction, color } = gameMoved.activePlayer as any
            const dir = direction as 'clockwise' | 'counterclockwise'

            const resolveOrigin = (): any => {
              const points = (gameMoved.board as any).points
              if (gm.moveKind === 'reenter') {
                const barDir = (gameMoved.board as any).bar[dir]
                return barDir?.checkers?.some((c: any) => c.color === color)
                  ? barDir
                  : undefined
              }
              const origin = points.find((p: any) => p.position[dir] === gm.from)
              if (!origin) return undefined
              return origin.checkers?.some((c: any) => c.color === color)
                ? origin
                : undefined
            }
            const origin = resolveOrigin()
            if (MAPPING_DEBUG) {
              console.log('[MAPDBG] GNU move selected:', gm)
              console.log('[MAPDBG] active dir:', dir, 'color:', color)
              console.log('[MAPDBG] resolved origin id:', origin?.id)
            }
            if (!origin) {
              throw new Error('GNU suggested origin has no checker of active color or is invalid')
            }
            if (origin) {
              selectedOrigin = origin
              // Map destination as well for robust matching
              const resolveDest = (): any => {
                const points = (gameMoved.board as any).points
                const toRaw: any = (gm as any).to
                if (toRaw === 'off') return (gameMoved.board as any).off[dir]
                const toVal = typeof toRaw === 'number' ? toRaw : NaN
                if (Number.isNaN(toVal)) return undefined
                return points.find((p: any) => p.position[dir] === toVal)
              }
              const destination = resolveDest()
              if (MAPPING_DEBUG) {
                console.log('[MAPDBG] resolved destination id:', destination?.id)
              }

              // Evaluate each ready die and pick the one whose possibleMoves include origin+destination
              const readyMoves = Array.from(gameMoved.activePlay.moves).filter(
                (m: any) => m.stateKind === 'ready'
              )
              for (const m of readyMoves) {
                const dv = m.dieValue
                const pm = Board.getPossibleMoves(
                  gameMoved.board,
                  (gameMoved as any).activePlay.player,
                  dv
                ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                const movesArr = Array.isArray(pm) ? pm : pm.moves
                // Prefer exact origin+destination match; otherwise accept any origin match
                const match = movesArr.find(
                  (mv: any) =>
                    mv.origin?.id === origin.id &&
                    (!destination || mv.destination?.id === destination.id)
                ) ||
                movesArr.find((mv: any) => mv.origin?.id === origin.id)
                if (match) {
                  chosenDie = dv
                  possibleMoves = movesArr
                  break
                }
              }
              if (!chosenDie) {
                // As a fallback to keep the simulation running, take the first legal ready move
                const fallback = readyMoves[0]
                if (!fallback) throw new Error('GNU suggested origin cannot be played with current dice')
                const pm = Board.getPossibleMoves(
                  gameMoved.board,
                  (gameMoved as any).activePlay.player,
                  fallback.dieValue
                ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                const movesArr = Array.isArray(pm) ? pm : pm.moves
                if (!movesArr.length) throw new Error('GNU suggested origin cannot be played with current dice')
                chosenDie = fallback.dieValue
                possibleMoves = movesArr
                selectedOrigin = movesArr[0].origin as any
                if (MAPPING_DEBUG) {
                  console.log('[MAPDBG] fallback die used:', chosenDie, 'origin id:', (selectedOrigin as any)?.id)
                }
              }
            }
          }
        }
        if (!isGnu || !chosenDie) {
          // Strictly require Nodots AI; no fallback allowed
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          const aiModule = await import('@nodots-llc/backgammon-ai')
          const best = await aiModule.selectBestMove(gameMoved.activePlay, 'nodots')
          if (!best) {
            throw new Error('Nodots AI did not return a move')
          }
          chosenDie = (best as any).dieValue
          possibleMoves = (best as any).possibleMoves && (best as any).possibleMoves.length
            ? (best as any).possibleMoves
            : ((): BackgammonMoveSkeleton[] => {
                const pm2 = Board.getPossibleMoves(
                  gameMoved.board,
                  (best as any).player,
                  (best as any).dieValue
                ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                return Array.isArray(pm2) ? pm2 : pm2.moves
              })()
          selectedOrigin = undefined
        }

        // Display all possible moves for this die value
        console.log(`\nPossible moves for die value ${chosenDie}:`)
        logger.info('[Simulation] Possible moves for die value:', {
          dieValue: chosenDie,
          possibleMovesCount: possibleMoves.length,
        })
        possibleMoves.forEach((possibleMove, index) => {
          const fromPoint =
            possibleMove.origin.kind === 'point'
              ? possibleMove.origin.position.clockwise
              : 'bar'
          const checkerCount =
            possibleMove.origin.kind === 'point'
              ? possibleMove.origin.checkers.length
              : possibleMove.origin.checkers.length
          const toPoint =
            possibleMove.destination.kind === 'point'
              ? possibleMove.destination.position.clockwise
              : 'off'
          console.log(
            `  ${
              index + 1
            }: from ${fromPoint} (${checkerCount} checkers) to ${toPoint}`
          )
        })

        // Take the selected origin if GNU chose one; otherwise first valid
        let validMove: any = null
        if (selectedOrigin) {
          validMove = possibleMoves.find(
            (mv) => (mv as any).origin?.id === (selectedOrigin as any).id
          )
        }
        if (!validMove) {
          for (const move of possibleMoves) {
            const origin = move.origin
            const checkers = origin.checkers
            if (
              checkers.length > 0 &&
              checkers[0].color === gameMoved.activeColor
            ) {
              validMove = move
              break
            }
          }
        }

        if (!validMove) {
          console.log('\nNo valid moves with checkers found')
          logger.warn('[Simulation] No valid moves with checkers found')
          break
        }

        const origin = validMove.origin
        const destination = validMove.destination

        console.log(
          `\nMove ${moveCount + 1}: from ${
            origin.kind === 'point' ? origin.position.clockwise : 'bar'
          } to ${
            destination.kind === 'point'
              ? destination.position.clockwise
              : 'off'
          }`
        )

        console.log('\nBoard before move:')
        logger.info('[Simulation] Board before move')
        try {
          const asciiBefore = Board.getAsciiGameBoard(
            (gameMoved as any).board,
            (gameMoved as any).players,
            (gameMoved as any).activeColor,
            (gameMoved as any).stateKind,
            undefined,
            labels
          )
          console.log(asciiBefore)
        } catch {
          Board.displayAsciiBoard((gameMoved as any).board)
        }

        try {
          // Ensure proper state transition before move
          const gameToMove = gameMoved
          const originChecker = origin.checkers.find(
            (c: any) => c.color === (gameMoved as any).activeColor
          )
          if (!originChecker) {
            console.log('No checker of active color at chosen origin; breaking')
            break
          }
          const moveResult = Game.move(
            gameToMove as BackgammonGameMoving,
            originChecker.id
          )
          if ((moveResult as any).stateKind === 'moved') {
            // Final checker move ended the turn
            gameMoved = moveResult as BackgammonGameMoved
          } else if ('board' in moveResult) {
            gameMoved = moveResult as BackgammonGameMoving
            moveCount++
            lastBoard = gameMoved.board

            console.log('\nBoard after move:')
            logger.info('[Simulation] Board after move')
            try {
              const asciiAfter = Board.getAsciiGameBoard(
                (gameMoved as any).board,
                (gameMoved as any).players,
                (gameMoved as any).activeColor,
                (gameMoved as any).stateKind,
                undefined,
                labels
              )
              console.log(asciiAfter)
            } catch {
              Board.displayAsciiBoard((gameMoved as any).board)
            }

            // Show remaining moves
            console.log('\nRemaining moves:')
            if (gameMoved.stateKind === 'moving') {
              Array.from(gameMoved.activePlay.moves).forEach((move: any) => {
                // Update possible moves for this die value
                const pm2 = Board.getPossibleMoves(
                  gameMoved.board,
                  move.player,
                  move.dieValue
                ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
                const possibleMoves = Array.isArray(pm2) ? pm2 : pm2.moves
                console.log(
                  `  Die value ${move.dieValue}: ${possibleMoves.length} possible moves`
                )
              })
            }
          }
        } catch (error) {
          console.log(`\nCouldn't make move: ${error}`)
          logger.error('[Simulation] Could not make move:', {
            error: error instanceof Error ? error.message : String(error),
            origin: origin.id,
            destination: destination.id,
          })
          break
        }
      }
    } catch (error) {
      console.log(`Error during moves: ${error}\n`)
      logger.error('[Simulation] Error during moves:', {
        error: error instanceof Error ? error.message : String(error),
        turnCount,
        moveCount,
      })
      // Use the last valid board state
      gameMoved = {
        ...gameMoved,
        board: lastBoard,
      } as BackgammonGameMoving
    }

    // If still in moving state here, attempt to complete the turn (handles no-move scenarios)
    if (gameMoved.stateKind === 'moving') {
      const completedState = Game.checkAndCompleteTurn(
        gameMoved as BackgammonGameMoving
      ) as BackgammonGameMoving | BackgammonGameMoved
      gameMoved = completedState
    }

    // When a turn completes, tally dice used and executed vs no-move
    if (gameMoved.stateKind === 'moved') {
      const allMoves = Array.from(gameMoved.activePlay.moves)
      const completed = allMoves.filter((m: any) => m.stateKind === 'completed')
      const executed = completed.filter(
        (m: any) => m.moveKind !== 'no-move' && !!m.origin
      )
      const noMoves = completed.length - executed.length
      diceUsedTotal += completed.length
      executedMovesTotal += executed.length
      noMovesTotal += noMoves
      lastBoard = gameMoved.board
    }

    // Check for winner
    const winner = checkWinCondition(gameMoved.board)
    if (winner) {
      console.log(`\n${winner.toUpperCase()} WINS!\n`)
      logger.info('[Simulation] Game won:', {
        winner,
        turnCount,
        executedMovesTotal,
        diceUsedTotal,
        noMovesTotal,
      })
      break
    }

    // Switch turns using core flow when in moved state
    if (gameMoved.stateKind === 'moved') {
      console.log(`Switching to next player's turn\n`)
      logger.info('[Simulation] Switching turns (confirmTurn)')
      gameState = Game.confirmTurn(gameMoved)
      lastBoard = gameState.board
    } else {
      // If still moving (shouldn't happen if all moves consumed), break to avoid loop
      console.log('Turn did not complete; breaking out to avoid hang')
      break
    }
  }

  // Display final statistics
  const stats = getStats(lastBoard)
  stats.totalTurns = turnCount
  stats.totalMoves = diceUsedTotal
  ;(stats as any).executedMoves = executedMovesTotal
  ;(stats as any).noMoves = noMovesTotal
  // Map off counts to the randomized labels
  displayStats(stats, gnuIsWhite)
}

// Allow running from command line with optional max turns argument
if (require.main === module) {
  const maxTurns = process.argv[2] ? parseInt(process.argv[2]) : 100
  runSimulation(maxTurns).catch((error) => {
    console.error(error)
    logger.error('[Simulation] Simulation failed:', {
      error: error instanceof Error ? error.message : String(error),
      maxTurns,
    })
  })
}

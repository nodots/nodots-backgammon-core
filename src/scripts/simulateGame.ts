import {
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGamePreparingMove,
  BackgammonGameRolled,
  BackgammonGameRollingForStart,
  BackgammonMoveReady,
  BackgammonPlayMoving,
  BackgammonPlayerMoving,
  BackgammonPlayers,
} from '@nodots-llc/backgammon-types/dist'
import { randomBackgammonColor } from '..'
import { Board } from '../Board'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
import { Game } from '../Game'
import { Player } from '../Player'
import { logger } from '../utils/logger'

const NUM_GAMES = 5 // Set how many games to simulate

async function simulateGame(verbose = false): Promise<{
  winner: 'black' | 'white' | null
  turnCount: number
  gameId: string
  stuck?: boolean
}> {
  // Initial game setup
  const clockwiseColor = randomBackgammonColor()
  const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black'
  const players: BackgammonPlayers = [
    Player.initialize(
      clockwiseColor,
      'clockwise',
      undefined,
      undefined,
      'inactive',
      true
    ),
    Player.initialize(
      counterclockwiseColor,
      'counterclockwise',
      undefined,
      undefined,
      'inactive',
      true
    ),
  ]

  // Start game
  let game = Game.initialize(players) as BackgammonGameRollingForStart
  const gameId = game.id
  if (verbose) {
    console.log('\nInitial board state:')
    console.log(Board.getAsciiBoard(game.board, players))
    logger.info('[SimulateGame] Initial board state:', { gameId })
  }

  // Track board state history for repetition detection
  const boardHistory: Record<string, number> = {}

  // Roll for start to determine first player
  let currentGame: BackgammonGame = Game.rollForStart(game)
  let turnCount = 0
  let winner: 'black' | 'white' | null = null
  const MAX_TURNS = 200
  let lastRoll: number[] | null = null

  while (!winner) {
    turnCount++
    if (turnCount > MAX_TURNS) {
      console.error(
        `Game ${gameId} exceeded max turns (${MAX_TURNS}). Possible logic bug or infinite loop.`
      )
      console.error('Current board state:')
      console.error(Board.getAsciiBoard((currentGame as any).board, players))
      console.error('Current active color:', (currentGame as any).activeColor)
      console.error('Current roll:', lastRoll ? lastRoll.join(', ') : 'N/A')
      logger.error('[SimulateGame] Game exceeded max turns:', {
        gameId,
        turnCount,
        maxTurns: MAX_TURNS,
        activeColor: (currentGame as any).activeColor,
        lastRoll,
      })
      return { winner: null, turnCount, gameId, stuck: true }
    }

    // Detect repeated board states (include active player and dice in key)
    const asciiBoard = Board.getAsciiBoard((currentGame as any).board, players)
    const activeColor: string = (currentGame as any).activeColor
    const diceKey = lastRoll ? lastRoll.join(',') : 'N/A'
    const repetitionKey = `${asciiBoard}\nActive: ${activeColor}\nDice: ${diceKey}`
    boardHistory[repetitionKey] = (boardHistory[repetitionKey] || 0) + 1

    if (verbose) {
      console.log(`\n=== Turn ${turnCount} ===`)
      logger.info('[SimulateGame] Turn started:', { turnCount, gameId })
    }

    // Roll dice and advance state
    let gameRolled: BackgammonGameRolled
    if (currentGame.stateKind === 'rolling-for-start') {
      const rolledForStart = Game.rollForStart(currentGame)
      gameRolled = Game.roll(rolledForStart)
    } else if (currentGame.stateKind === 'rolled-for-start') {
      gameRolled = Game.roll(currentGame)
    } else if (currentGame.stateKind === 'rolling') {
      gameRolled = Game.roll(currentGame)
    } else {
      throw new Error('currentGame is not in a rollable state')
    }
    const roll = (gameRolled.activePlayer as any).dice.currentRoll
    if (roll) {
      lastRoll = roll
    }
    if (verbose) {
      console.log(`\n${gameRolled.activeColor}'s roll: ${roll.join(', ')}`)
      logger.info('[SimulateGame] Dice rolled:', {
        gameId,
        turnCount,
        activeColor: gameRolled.activeColor,
        roll,
      })
    }

    // Refactored move loop: use as many dice as possible, mark unused as 'no-move', then end turn
    let dice =
      roll[0] === roll[1] ? [roll[0], roll[0], roll[0], roll[0]] : [...roll]
    let usedDice = []
    let noMoveDice = []
    let moveCount = 0
    while (dice.length > 0) {
      let moveMade = false
      if (verbose) {
        // Print bar state before moves
        const bar = gameRolled.board.bar[gameRolled.activePlayer.direction]
        const barCheckers = bar.checkers.map((c: any) => c.color).join(', ')
        console.log(
          `\nBar (${gameRolled.activePlayer.direction}) before moves: [${barCheckers}] (count: ${bar.checkers.length})`
        )
        logger.info('[SimulateGame] Bar state before moves:', {
          gameId,
          turnCount,
          direction: gameRolled.activePlayer.direction,
          barCheckers: bar.checkers.map((c: any) => c.color),
          barCount: bar.checkers.length,
        })
      }
      // Try each die, always using the latest gameRolled and activePlayer
      for (let i = 0; i < dice.length; i++) {
        const die = dice[i]
        const possibleMoves = Board.getPossibleMoves(
          gameRolled.board,
          gameRolled.activePlayer,
          die as any
        )
        if (verbose) {
          console.log(`\nChecking possible moves for die ${die}:`)
          if (possibleMoves.length === 0) {
            console.log('  No possible moves.')
            logger.info('[SimulateGame] No possible moves for die:', {
              gameId,
              turnCount,
              die,
              activeColor: gameRolled.activeColor,
            })
          } else {
            possibleMoves.forEach((move, idx) => {
              const origin = move.origin
              const destination = move.destination
              const dir = gameRolled.activePlayer.direction
              const originPos =
                origin.kind === 'point' ? origin.position[dir] : 'bar'
              const destPos =
                destination.kind === 'point' ? destination.position[dir] : 'off'
              console.log(
                `  Option ${idx + 1}: from ${originPos} to ${destPos}`
              )
            })
            logger.info('[SimulateGame] Possible moves for die:', {
              gameId,
              turnCount,
              die,
              possibleMovesCount: possibleMoves.length,
              activeColor: gameRolled.activeColor,
            })
          }
        }
        if (possibleMoves.length > 0) {
          // Ensure player is BackgammonPlayerMoving (stateKind: 'moving')
          const playerMoving = {
            ...gameRolled.activePlayer,
            stateKind: 'moving',
          } as unknown as BackgammonPlayerMoving
          const movesSet = new Set<BackgammonMoveReady>(
            possibleMoves.map((m, idx) => ({
              id: `move_${i}_${idx}`,
              player: playerMoving,
              dieValue: die,
              stateKind: 'ready',
              moveKind: 'point-to-point',
              origin: m.origin,
              possibleMoves: [],
            }))
          )
          const playMoving: BackgammonPlayMoving = {
            id: `play_${i}`,
            player: playerMoving,
            board: gameRolled.board,
            moves: movesSet,
            stateKind: 'moving',
          }
          // Always generate a fresh positionId for gnubg (for logging/debugging if needed)
          const positionId = exportToGnuPositionId({
            board: playMoving.board,
            players: gameRolled.players,
            stateKind: 'rolled',
            activePlayer: playMoving.player,
            inactivePlayer:
              gameRolled.players.find(
                (p: any) => p.id !== playMoving.player.id
              ) || playMoving.player,
            activeColor: playMoving.player.color,
          } as any)
          // Optionally log or use positionId for debugging
          // console.log('Current GNU Position ID:', positionId);

          const selectedMove = await Player.getBestMove(
            playMoving,
            'gnubg',
            gameRolled.players
          )
          let origin, destination
          if (selectedMove) {
            origin = selectedMove.origin
            destination = undefined // BackgammonMoveReady does not have destination
          } else {
            // fallback to first possible move (BackgammonMoveSkeleton)
            origin = possibleMoves[0].origin
            destination = possibleMoves[0].destination
          }
          moveCount++
          if (verbose) {
            console.log(
              `\nMove ${moveCount}: from ${
                origin.kind === 'point'
                  ? origin.position[gameRolled.activePlayer.direction]
                  : 'bar'
              } to ${
                destination && destination.kind === 'point'
                  ? destination.position[gameRolled.activePlayer.direction]
                  : 'off'
              } (die: ${die})`
            )
            logger.info('[SimulateGame] Move made:', {
              gameId,
              turnCount,
              moveCount,
              die,
              origin:
                origin.kind === 'point'
                  ? origin.position[gameRolled.activePlayer.direction]
                  : 'bar',
              destination:
                destination && destination.kind === 'point'
                  ? destination.position[gameRolled.activePlayer.direction]
                  : 'off',
            })
          }
          try {
            // Handle state transitions using functional switch statement with early returns
            const transitionGameToMoving = (
              game:
                | BackgammonGameRolled
                | BackgammonGamePreparingMove
                | BackgammonGameMoving
            ): BackgammonGameMoving => {
              switch (game.stateKind) {
                case 'rolled': {
                  // First move of the turn: rolled -> preparing-move -> moving
                  const preparingGame = Game.prepareMove(
                    game as BackgammonGameRolled
                  )
                  return Game.toMoving(preparingGame)
                }

                case 'preparing-move': {
                  // Direct transition from preparing-move to moving
                  return Game.toMoving(game as BackgammonGamePreparingMove)
                }

                case 'moving': {
                  // Already in moving state for subsequent moves in the same turn
                  return game as BackgammonGameMoving
                }

                default: {
                  throw new Error(
                    `Invalid game state for move: ${(game as any).stateKind}`
                  )
                }
              }
            }

            const gameMoving = transitionGameToMoving(
              gameRolled as
                | BackgammonGameRolled
                | BackgammonGamePreparingMove
                | BackgammonGameMoving
            )

            // Execute the move
            const moveResult = Game.move(gameMoving, origin.id)
            if ((moveResult as any).stateKind === 'completed') {
              winner = (moveResult as any).winner.color
              currentGame = moveResult as any
              dice = []
              break
            }
            gameRolled = moveResult as any
            usedDice.push(die)
            dice.splice(i, 1)
            moveMade = true
            if (verbose) {
              console.log('\nBoard after move:')
              console.log(Board.getAsciiBoard(gameRolled.board, players))
              // Print bar state after move
              const bar =
                gameRolled.board.bar[gameRolled.activePlayer.direction]
              const barCheckers = bar.checkers
                .map((c: any) => c.color)
                .join(', ')
              console.log(
                `Bar (${gameRolled.activePlayer.direction}) after move: [${barCheckers}] (count: ${bar.checkers.length})`
              )
              console.log(`Remaining dice: ${dice.join(', ')}`)
              logger.info('[SimulateGame] Board after move:', {
                gameId,
                turnCount,
                moveCount,
                remainingDice: dice,
                barState: bar.checkers.map((c: any) => c.color),
              })
            }
            // WIN CONDITION CHECK: If either player has borne off all 15 checkers, declare winner
            const offClockwise = gameRolled.board.off.clockwise.checkers.length
            const offCounterclockwise =
              gameRolled.board.off.counterclockwise.checkers.length
            if (offClockwise === 15) {
              const clockwisePlayer = players.find(
                (p: any) => p.direction === 'clockwise'
              )
              winner = clockwisePlayer ? clockwisePlayer.color : 'white'
              currentGame = gameRolled as any
              dice = []
              break
            }
            if (offCounterclockwise === 15) {
              const counterclockwisePlayer = players.find(
                (p: any) => p.direction === 'counterclockwise'
              )
              winner = counterclockwisePlayer
                ? counterclockwisePlayer.color
                : 'black'
              currentGame = gameRolled as any
              dice = []
              break
            }
            // After a move, restart the dice loop with updated state
            i = -1 // restart dice loop from beginning after a move
            break
          } catch (error) {
            if (verbose) {
              console.log(`\nCouldn't make move: ${error}`)
              logger.error('[SimulateGame] Could not make move:', {
                gameId,
                turnCount,
                die,
                error: error instanceof Error ? error.message : String(error),
              })
            }

            // Check if this is a state transition error
            if (
              error instanceof Error &&
              error.message.includes('Cannot move from rolled state')
            ) {
              console.error(`\n🚨 GAME STUCK - State Management Error!`)
              console.error(`Game ID: ${gameId}`)
              console.error(`Turn: ${turnCount}`)
              console.error(`Active Color: ${gameRolled.activeColor}`)
              console.error(`Game State: ${gameRolled.stateKind}`)
              console.error(
                `Active Play State: ${
                  gameRolled.activePlay?.stateKind || 'N/A'
                }`
              )
              console.error(`Die: ${die}`)
              console.error(
                `Origin: ${
                  origin.kind === 'point'
                    ? `point-${
                        origin.position[gameRolled.activePlayer.direction]
                      }`
                    : origin.kind
                }`
              )
              console.error(`Error: ${error.message}`)

              // Log current board state
              console.error('\n📋 Current Board State:')
              console.error(Board.getAsciiBoard(gameRolled.board, players))

              // Log move state details
              console.error('\n🎲 Move State Details:')
              const movesArray = Array.from(gameRolled.activePlay?.moves || [])
              movesArray.forEach((move, index) => {
                console.error(
                  `  Move ${index + 1}: stateKind=${move.stateKind}, dieValue=${
                    move.dieValue
                  }, moveKind=${move.moveKind || 'N/A'}`
                )
              })

              // Log dice state
              console.error('\n🎯 Dice State:')
              console.error(
                `  Current Roll: ${
                  gameRolled.activePlayer.dice.currentRoll?.join(', ') || 'N/A'
                }`
              )
              console.error(
                `  Dice State: ${gameRolled.activePlayer.dice.stateKind}`
              )

              logger.error(
                '[SimulateGame] Game stuck due to state management error:',
                {
                  gameId,
                  turnCount,
                  activeColor: gameRolled.activeColor,
                  gameState: gameRolled.stateKind,
                  activePlayState: gameRolled.activePlay?.stateKind,
                  die,
                  originKind: origin.kind,
                  errorMessage: error.message,
                  movesState: movesArray.map((m) => ({
                    stateKind: m.stateKind,
                    dieValue: m.dieValue,
                    moveKind: m.moveKind,
                  })),
                  diceState: gameRolled.activePlayer.dice,
                }
              )

              return { winner: null, turnCount, gameId, stuck: true }
            }

            // Try next die
          }
        }
        if (verbose) {
          // Print which point is being checked for re-entry (for bar moves)
          const barCheckers =
            gameRolled.board.bar[gameRolled.activePlayer.direction].checkers
              .length
          if (barCheckers > 0) {
            let reentryPoint: number
            if (gameRolled.activePlayer.direction === 'clockwise') {
              reentryPoint = die
            } else {
              reentryPoint = 25 - die
            }
            // Find the point object for this reentry point
            const points = Board.getPoints(gameRolled.board)
            const entryPointObj = points.find(
              (pt: any) => pt.position.clockwise === reentryPoint
            )
            const entryCheckers = entryPointObj
              ? entryPointObj.checkers.map((c: any) => c.color).join(', ')
              : 'N/A'
            const entryCount = entryPointObj ? entryPointObj.checkers.length : 0
            const blocked =
              entryPointObj &&
              entryPointObj.checkers.length >= 2 &&
              entryPointObj.checkers[0].color !== gameRolled.activePlayer.color
            console.log(
              `DEBUG: Die ${die} re-entry for ${gameRolled.activePlayer.color} (${gameRolled.activePlayer.direction}): point ${reentryPoint} | checkers: [${entryCheckers}] (count: ${entryCount}) | blocked: ${blocked}`
            )
            logger.debug('[SimulateGame] Re-entry check:', {
              gameId,
              turnCount,
              die,
              reentryPoint,
              entryCheckers: entryPointObj
                ? entryPointObj.checkers.map((c: any) => c.color)
                : [],
              entryCount,
              blocked,
            })
          }
        }
      }
      if (!moveMade) {
        // No moves possible for any remaining dice
        noMoveDice.push(...dice)
        if (verbose && dice.length > 0) {
          console.log(`\nNo moves possible for dice: ${dice.join(', ')}`)
          console.log('Breaking out of move loop.')
          logger.warn('[SimulateGame] No moves possible for dice:', {
            gameId,
            turnCount,
            dice,
            activeColor: gameRolled.activeColor,
          })
        }
        break
      }
    }

    if (winner) {
      break
    }

    // After move loop, check for deadlock (both players stuck on bar)
    const barBlack = gameRolled.board.bar.clockwise
    const barWhite = gameRolled.board.bar.counterclockwise
    const hasBlackOnBar = barBlack.checkers.some(
      (c: any) => c.color === 'black'
    )
    const hasWhiteOnBar = barWhite.checkers.some(
      (c: any) => c.color === 'white'
    )
    let blackCanReenter = false
    let whiteCanReenter = false
    const blackPlayer = gameRolled.players.find((p: any) => p.color === 'black')
    const whitePlayer = gameRolled.players.find((p: any) => p.color === 'white')
    if (hasBlackOnBar && blackPlayer) {
      for (let die = 1; die <= 6; die++) {
        const moves = Board.getPossibleMoves(
          gameRolled.board,
          blackPlayer,
          die as any
        )
        if (moves.length > 0) {
          blackCanReenter = true
          break
        }
      }
    } else {
      blackCanReenter = true
    }
    if (hasWhiteOnBar && whitePlayer) {
      for (let die = 1; die <= 6; die++) {
        const moves = Board.getPossibleMoves(
          gameRolled.board,
          whitePlayer,
          die as any
        )
        if (moves.length > 0) {
          whiteCanReenter = true
          break
        }
      }
    } else {
      whiteCanReenter = true
    }
    if (!blackCanReenter && !whiteCanReenter) {
      console.error(
        `Game ${gameId} deadlocked: both players have checkers on the bar and cannot reenter.`
      )
      console.error('Current board state:')
      console.error(Board.getAsciiBoard((currentGame as any).board, players))
      console.error('Current active color:', (currentGame as any).activeColor)
      console.error('Current roll:', lastRoll ? lastRoll.join(', ') : 'N/A')
      logger.error(
        '[SimulateGame] Game deadlocked - both players stuck on bar:',
        {
          gameId,
          turnCount,
          activeColor: (currentGame as any).activeColor,
          lastRoll,
          hasBlackOnBar,
          hasWhiteOnBar,
        }
      )
      return { winner: null, turnCount, gameId, stuck: true }
    }

    // Enhanced deadlock detection: check if both players have no possible legal moves for any die value
    const allPlayers = [blackPlayer, whitePlayer]
    const playerCanMove = allPlayers.map((player) => {
      if (!player) return false
      for (let die = 1; die <= 6; die++) {
        const moves = Board.getPossibleMoves(
          gameRolled.board,
          player,
          die as any
        )
        if (moves.length > 0) return true
      }
      return false
    })
    if (!playerCanMove[0] && !playerCanMove[1]) {
      console.error(
        `Game ${gameId} deadlocked: neither player has any legal moves for any die value.`
      )
      console.error('Current board state:')
      console.error(Board.getAsciiBoard((currentGame as any).board, players))
      console.error('Current active color:', (currentGame as any).activeColor)
      console.error('Current roll:', lastRoll ? lastRoll.join(', ') : 'N/A')
      logger.error(
        '[SimulateGame] Game deadlocked - no legal moves for any player:',
        {
          gameId,
          turnCount,
          activeColor: (currentGame as any).activeColor,
          lastRoll,
          blackCanMove: playerCanMove[0],
          whiteCanMove: playerCanMove[1],
        }
      )
      return { winner: null, turnCount, gameId, stuck: true }
    }

    // Switch turns if no winner yet
    const newActiveColor = gameRolled.inactivePlayer.color
    let [newActivePlayer, newInactivePlayer] = Game.getPlayersForColor(
      gameRolled.players,
      newActiveColor
    )
    // Set correct stateKinds for next turn
    newActivePlayer = Player.initialize(
      newActivePlayer.color,
      newActivePlayer.direction,
      undefined,
      newActivePlayer.id,
      'rolling'
    ) as any // BackgammonPlayerRolling
    newInactivePlayer = Player.initialize(
      newInactivePlayer.color,
      newInactivePlayer.direction,
      undefined,
      newInactivePlayer.id,
      'inactive'
    ) as any // BackgammonPlayerInactive
    currentGame = Game.initialize(
      [newActivePlayer, newInactivePlayer],
      gameRolled.id,
      'rolling',
      gameRolled.board,
      gameRolled.cube,
      undefined, // activePlay
      newActiveColor,
      newActivePlayer,
      newInactivePlayer
    )
    if (verbose) {
      console.log(`\nSwitching to ${currentGame.activeColor}'s turn`)
      logger.info('[SimulateGame] Switching turns:', {
        gameId,
        turnCount,
        fromColor: gameRolled.activeColor,
        toColor: currentGame.activeColor,
      })
    }
  }

  if (verbose) {
    // Display final game state and winner
    console.log('\n=== GAME OVER ===')
    console.log(`Winner: ${winner}`)
    console.log('\nFinal board state:')
    console.log(Board.getAsciiBoard((currentGame as any).board, players))
    console.log(`\nGame completed in ${turnCount} turns`)
    logger.info('[SimulateGame] Game completed:', {
      gameId,
      winner,
      turnCount,
      stuck: false,
    })
  }
  return { winner, turnCount, gameId }
}

async function runSimulations(numGames = NUM_GAMES) {
  const startTime = process.hrtime.bigint()
  const stats = {
    totalGames: 0,
    wins: { black: 0, white: 0 } as { black: number; white: number },
    turns: [] as number[],
  }
  for (let i = 0; i < numGames; i++) {
    const { winner, turnCount, gameId, stuck } = await simulateGame(false)
    stats.totalGames++
    if (winner === 'black' || winner === 'white') {
      stats.wins[winner]++
    }
    stats.turns.push(turnCount)
    // Progress indicator: print one '*' every 1000 games for speed
    if ((i + 1) % 1000 === 0) {
      process.stdout.write('*')
    }
    // Halt on stuck games
    if (stuck) {
      break
    }
  }
  // Calculate statistics
  const totalTurns = stats.turns.reduce((a, b) => a + b, 0)
  const avgTurns = totalTurns / stats.totalGames
  const minTurns = Math.min(...stats.turns)
  const maxTurns = Math.max(...stats.turns)

  // Print summary
  const endTime = process.hrtime.bigint()
  const totalMs = Number(endTime - startTime) / 1e6
  const avgMsPerGame = totalMs / stats.totalGames
  console.log('\n=== SIMULATION SUMMARY ===')
  console.log(`Total games: ${stats.totalGames}`)
  console.log(`Black wins: ${stats.wins.black}`)
  console.log(`White wins: ${stats.wins.white}`)
  console.log(`Average turns per game: ${avgTurns.toFixed(2)}`)
  console.log(`Min turns: ${minTurns}`)
  console.log(`Max turns: ${maxTurns}`)
  console.log(`Total simulation time: ${totalMs.toFixed(2)} ms`)
  console.log(`Average time per game: ${avgMsPerGame.toFixed(4)} ms`)
  logger.info('[SimulateGame] Simulation summary:', {
    totalGames: stats.totalGames,
    blackWins: stats.wins.black,
    whiteWins: stats.wins.white,
    averageTurns: avgTurns,
    minTurns,
    maxTurns,
    totalSimulationTimeMs: totalMs,
    averageTimePerGameMs: avgMsPerGame,
  })
}

// Run the simulations
;(async () => {
  await runSimulations(NUM_GAMES)
})()

export { simulateGame }

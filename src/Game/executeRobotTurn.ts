import {
  BackgammonBoard,
  BackgammonGame,
  BackgammonGameMoved,
  BackgammonGameMoving,
  BackgammonGameRolling,
  BackgammonPlayerInactive,
  BackgammonPlayerRolling,
  BackgammonPlayersRollingTuple,
  BackgammonPlayMoving,
} from '@nodots-llc/backgammon-types'
import { GnuBgHints } from '@nodots-llc/gnubg-hints'
import { Checker } from '../Checker'
import { Play } from '../Play'
import { logger } from '../utils/logger'
import { exportToGnuPositionId } from '../Board/gnuPositionId'
// Avoid importing Game or Player here to prevent circular dependencies

// Pure helpers for functional style
const isAllCompleted = (play: BackgammonPlayMoving) =>
  (play.moves || []).every((m) => m.stateKind === 'completed')

const hasAnyReady = (play: BackgammonPlayMoving) =>
  (play.moves || []).some((m) => m.stateKind === 'ready')

const getCurrentRollOrThrow = (game: BackgammonGameMoving) => {
  const roll = game.activePlayer.dice?.currentRoll
  if (!roll || roll.length !== 2) {
    throw new Error('Robot turn requires current dice roll to be present')
  }
  return roll
}

const getGnuMovesOrThrow = async (
  game: BackgammonGameMoving,
  roll: readonly [number, number]
) => {
  const positionId = exportToGnuPositionId(game as any)
  await GnuBgHints.initialize()
  GnuBgHints.configure({ evalPlies: 2, moveFilter: 2, usePruning: true })
  const hints = await GnuBgHints.getHintsFromPositionId(positionId, roll as any)
  if (!hints || hints.length === 0 || !hints[0].moves || hints[0].moves.length === 0) {
    throw new Error('GNU Backgammon did not return a valid move sequence')
  }
  return hints[0].moves
}

const requireCheckerOfColor = (
  container: any,
  color: any,
  err: string
) => {
  const count = (container?.checkers || []).filter((c: any) => c.color === color).length
  if (count <= 0) throw new Error(err)
  return container
}

const findOriginOrThrow = (
  board: BackgammonBoard,
  direction: 'clockwise' | 'counterclockwise',
  color: 'white' | 'black',
  gm: any
) => {
  switch (gm.moveKind) {
    case 'reenter':
      return requireCheckerOfColor(
        board.bar[direction],
        color,
        'GNU suggested reentry but no checker on bar'
      )
    case 'bear-off':
    case 'point-to-point': {
      const origin = board.points.find((p) => p.position[direction] === gm.from)
      if (!origin) throw new Error(`GNU suggested move from invalid origin position ${gm.from}`)
      return requireCheckerOfColor(
        origin,
        color,
        'GNU suggested origin has no checker of active player'
      )
    }
    default:
      throw new Error(`Unknown GNU move kind: ${String(gm.moveKind)}`)
  }
}

type TurnState = {
  board: BackgammonBoard
  play: BackgammonPlayMoving
  moveCount: number
}

const applyGnuMove = (
  state: TurnState,
  origin: any,
  desiredDestinationId?: string
): TurnState => {
  const result = Play.move(state.board, state.play, origin, desiredDestinationId)
  return {
    board: result.board,
    play: result.play as BackgammonPlayMoving,
    moveCount: state.moveCount + 1,
  }
}

const confirmToNextRolling = (
  gameMoved: BackgammonGameMoved
): BackgammonGameRolling => {
  const boardWithResetMovable = Checker.updateMovableCheckers(gameMoved.board, [])
  const nextColor = gameMoved.activeColor === 'white' ? 'black' : 'white'

  const updatedPlayers = gameMoved.players.map((player) =>
    player.color === gameMoved.activeColor
      ? {
          ...player,
          stateKind: 'inactive' as const,
          dice:
            player.isRobot && player.dice?.currentRoll
              ? { ...player.dice, stateKind: 'inactive' as const }
              : { stateKind: 'inactive' as const },
        }
      : { ...player, stateKind: 'rolling' as const, dice: { stateKind: 'rolling' as const } }
  ) as BackgammonPlayersRollingTuple

  const [p0, p1] = updatedPlayers
  const newActive = (p0.color === nextColor ? p0 : p1) as BackgammonPlayerRolling
  const newInactive = (p0.color !== nextColor ? p0 : p1) as BackgammonPlayerInactive

  return {
    ...gameMoved,
    stateKind: 'rolling',
    board: boardWithResetMovable,
    activeColor: nextColor,
    players: updatedPlayers,
    activePlayer: newActive,
    inactivePlayer: newInactive,
    activePlay: undefined,
  }
}

// NOTE: We intentionally avoid importing Game here to prevent circular dependencies.
// This function performs the complete robot turn within core: execute moves, then
// auto-confirm the turn to transition to the next player's rolling state.

export const executeRobotTurn = async function executeRobotTurn(
  game: BackgammonGame
): Promise<BackgammonGame> {
  // Handle simple automation when called in 'moved' state with robot active
  if (game.stateKind === 'moved' && game.activePlayer.isRobot) {
    return confirmToNextRolling(game as BackgammonGameMoved)
  }

  // Support being called from 'rolling' by rolling dice to enter 'moving'
  let movingGame: BackgammonGameMoving
  if (game.stateKind === 'moving') {
    movingGame = game as BackgammonGameMoving
  } else if (game.stateKind === 'rolling') {
    if (!game.activePlayer.isRobot)
      throw new Error('Cannot execute robot turn for non-robot player')
    const activePlayerRolling = game.activePlayer
    const inactivePlayer = game.inactivePlayer

    // Roll dice inline (avoid Player.roll to prevent circular import)
    const d1 = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6
    const d2 = (Math.floor(Math.random() * 6) + 1) as 1 | 2 | 3 | 4 | 5 | 6
    const playerMoving = {
      ...activePlayerRolling,
      stateKind: 'moving' as const,
      dice: {
        ...activePlayerRolling.dice,
        stateKind: 'rolled' as const,
        currentRoll: [d1, d2] as [typeof d1, typeof d2],
        total: (d1 + d2) as number,
      },
    }
    const activePlay = Play.initialize(game.board, playerMoving)

    // If no moves are possible (all completed as no-moves), skip to confirmation later
    movingGame = {
      ...game,
      stateKind: 'moving',
      activePlayer: playerMoving,
      inactivePlayer,
      activePlay,
    } as BackgammonGameMoving
  } else {
    throw new Error(`Cannot execute robot turn from ${game.stateKind} state. Must be in 'moving' state.`)
  }
  if (!movingGame.activePlayer.isRobot) {
    throw new Error('Cannot execute robot turn for non-robot player')
  }
  if (!movingGame.activePlay) {
    throw new Error('No active play found. Game must be in a valid play state.')
  }

  let state: TurnState = {
    board: movingGame.board,
    play: movingGame.activePlay as BackgammonPlayMoving,
    moveCount: 0,
  }
  const maxMoves = 4 // Max possible moves in a turn (doubles)

  logger.info('🤖 [executeRobotTurn] Starting robot turn', {
    activeColor: movingGame.activeColor,
    movesCount: state.play.moves?.length || 0,
  })

  // If all moves are already completed (no-move scenario), skip to confirmation
  if (!isAllCompleted(state.play)) {
    const roll = getCurrentRollOrThrow(movingGame)
    const gnuMoves = await getGnuMovesOrThrow(movingGame, roll)
    const { direction, color } = movingGame.activePlayer

    for (const gm of gnuMoves) {
      if (isAllCompleted(state.play)) {
        throw new Error('GNU suggested more moves than available ready moves')
      }
      if (!hasAnyReady(state.play)) {
        throw new Error('GNU suggested a move but there are no ready moves remaining')
      }
      const origin = findOriginOrThrow(state.board, direction, color, gm)
      logger.info('🤖 [executeRobotTurn] GNU suggestion', {
        moveKind: gm.moveKind,
        from: gm.from,
        to: gm.to,
        direction,
      })
      state = applyGnuMove(state, origin)
      logger.info('🤖 [executeRobotTurn] Executed GNU move', {
        moveCount: state.moveCount,
        remainingReadyMoves: state.play.moves.filter((m) => m.stateKind === 'ready').length,
      })
      if ((state.play as any).stateKind === 'moved') break
      if (state.moveCount >= maxMoves) break
    }
  }

  // Transition to 'moved' (end of turn) and auto-confirm to next player's 'rolling' state
  const movedGame: BackgammonGameMoved = {
    ...movingGame,
    stateKind: 'moved',
    board: Checker.updateMovableCheckers(state.board, []),
    activePlay: state.play,
  }
  const nextRolling = confirmToNextRolling(movedGame)

  logger.info('🤖 [executeRobotTurn] Turn complete, next player rolling', {
    nextActiveColor: nextRolling.activeColor,
    nextIsRobot: nextRolling.activePlayer.isRobot,
  })

  return nextRolling
}

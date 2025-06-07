import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonCube,
  BackgammonGame,
  BackgammonGameMoving,
  BackgammonGameRolled,
  BackgammonGameRolledForStart,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonGameStateKind,
  BackgammonMoveOrigin,
  BackgammonPlay,
  BackgammonPlayerActive,
  BackgammonPlayerInactive,
  BackgammonPlayerRolledForStart,
  BackgammonPlayerRolling,
  BackgammonPlayers,
  BackgammonPlayRolled,
  BackgammonPlayMoving,
} from '@nodots-llc/backgammon-types'
import { generateId, Player, randomBackgammonColor } from '..'
import { Board } from '../Board'
import { Cube } from '../Cube'
import { Play } from '../Play'

export interface GameProps {
  players: BackgammonPlayers
  board?: BackgammonBoard
  cube?: BackgammonCube
}

export class Game {
  id!: string
  stateKind!: BackgammonGameStateKind
  players!: BackgammonPlayers
  board!: Board
  cube!: Cube
  activeColor!: BackgammonColor
  activePlay!: BackgammonPlay
  activePlayer!: BackgammonPlayerActive
  inactivePlayer!: BackgammonPlayerInactive

  public static initialize = function initializeGame(
    players: BackgammonPlayers,
    id: string = generateId(),
    stateKind: BackgammonGameStateKind = 'rolling-for-start',
    board: BackgammonBoard = Board.initialize(),
    cube: BackgammonCube = Cube.initialize(),
    activePlay?: BackgammonPlay,
    activeColor?: BackgammonColor,
    activePlayer?: BackgammonPlayerActive,
    inactivePlayer?: BackgammonPlayerInactive,
    origin?: BackgammonMoveOrigin
  ): BackgammonGame {
    switch (stateKind) {
      case 'rolling-for-start':
        return {
          id,
          stateKind,
          players,
          board,
          cube,
        } as BackgammonGameRollingForStart
      case 'rolled-for-start':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolledForStart
      case 'rolling':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
        } as BackgammonGameRolling
      case 'moving':
        if (!activeColor) throw new Error('Active color must be provided')
        if (!activePlayer) throw new Error('Active player must be provided')
        if (!inactivePlayer) throw new Error('Inactive player must be provided')
        if (!activePlay) throw new Error('Active play must be provided')
        return {
          id,
          stateKind,
          players,
          board,
          cube,
          activeColor,
          activePlayer,
          inactivePlayer,
          activePlay,
        } as BackgammonGameMoving
      case 'rolled':
        throw new Error('Game cannot be initialized in the rolled state')
      case 'moved':
        throw new Error('Game cannot be initialized in the moved state')
      case 'completed':
        throw new Error('Game cannot be initialized in the completed state')
      case 'doubling':
        throw new Error('Game cannot be initialized in the doubling state')
      case 'doubled':
        throw new Error('Game cannot be initialized in the doubled state')
    }
    // Exhaustiveness check
    const _exhaustiveCheck: never = stateKind
    throw new Error(`Unhandled stateKind: ${stateKind}`)
  }

  public static rollForStart = function rollForStart(
    game: BackgammonGameRollingForStart
  ): BackgammonGameRolledForStart {
    const activeColor = randomBackgammonColor()
    const rollingPlayers = game.players.map((p) =>
      p.color === activeColor
        ? Player.initialize(
            p.color,
            p.direction,
            undefined,
            p.id,
            'rolled-for-start',
            true
          )
        : Player.initialize(
            p.color,
            p.direction,
            undefined,
            p.id,
            'inactive',
            true
          )
    ) as BackgammonPlayers
    const activePlayer = rollingPlayers.find(
      (p) => p.color === activeColor
    ) as BackgammonPlayerRolledForStart
    const inactivePlayer = rollingPlayers.find(
      (p) => p.color !== activeColor
    ) as BackgammonPlayerInactive
    return {
      ...game,
      stateKind: 'rolled-for-start',
      activeColor,
      players: rollingPlayers,
      activePlayer,
      inactivePlayer,
    } as BackgammonGameRolledForStart
  }

  public static roll = function roll(
    game: BackgammonGameRolledForStart | BackgammonGameRolling
  ): BackgammonGameRolled {
    if (game.stateKind === 'rolled-for-start') {
      const { players, board, cube, activeColor, activePlayer } = game
      const rollingPlayers = players.map((p) => {
        if (p.color === activeColor) {
          if (p.stateKind === 'rolling') return p
          return Player.initialize(
            p.color,
            p.direction,
            undefined,
            p.id,
            'rolling',
            true
          )
        }
        return Player.initialize(
          p.color,
          p.direction,
          undefined,
          p.id,
          'inactive',
          true
        )
      }) as BackgammonPlayers
      const newActivePlayer = rollingPlayers.find(
        (p) => p.color === activeColor
      ) as BackgammonPlayerRolling
      const inactivePlayer = rollingPlayers.find(
        (p) => p.color !== activeColor
      ) as BackgammonPlayerInactive
      const rollingGame: BackgammonGameRolling = {
        ...game,
        stateKind: 'rolling',
        players: rollingPlayers,
        activePlayer: newActivePlayer,
        inactivePlayer,
        activeColor: activeColor!,
      }
      return Game.roll(rollingGame)
    }
    const { players, board, activeColor } = game
    if (!activeColor) throw new Error('Active color must be provided')
    let [activePlayerForColor, inactivePlayerForColor] =
      Game.getPlayersForColor(players, activeColor!)
    if (activePlayerForColor.stateKind !== 'rolling') {
      throw new Error('Active player must be in rolling state')
    }
    const activePlayerRolling = activePlayerForColor as BackgammonPlayerRolling
    const inactivePlayer = inactivePlayerForColor
    if (!inactivePlayer) throw new Error('Inactive player not found')

    const playerRolled = Player.roll(activePlayerRolling)
    const activePlay = Play.initialize(board, playerRolled)

    const rolledPlay = {
      ...activePlay,
      stateKind: 'rolled',
      player: playerRolled,
    } as BackgammonPlayRolled

    return {
      ...game,
      stateKind: 'rolled',
      activePlayer: playerRolled,
      activePlay: rolledPlay,
      board,
    } as BackgammonGameRolled
  }

  public static move = function move(
    game: BackgammonGameMoving | BackgammonGameRolled,
    originId: string
  ): BackgammonGameMoving | BackgammonGame {
    let { activePlay, board } = game

    // If in 'rolled', transition to 'moving'
    if (activePlay.stateKind === 'rolled') {
      // You may need to create a PlayMoving from PlayRolled
      activePlay = Play.startMove(activePlay)
      game = Game.startMove(game as BackgammonGameRolled, activePlay)
    }

    if (activePlay.stateKind !== 'moving') {
      throw new Error('activePlay must be in moving state to make a move')
    }

    const playResult = Player.move(board, activePlay, originId)
    board = playResult.board

    // Update activePlayer from the move result if available
    let movedPlayer =
      playResult.move && playResult.move.player
        ? playResult.move.player
        : game.activePlayer

    // Always update activePlay from playResult (fallback to activePlay if undefined)
    const updatedActivePlay = (playResult as any).play || activePlay

    // --- WIN CONDITION CHECK ---
    // Check if the player has won (all checkers off) AFTER the move is processed
    // IMPORTANT: This check must happen after the checker is moved off the board
    const direction = movedPlayer.direction
    const playerOff = board.off[direction]
    const playerCheckersOff = playerOff.checkers.filter(
      (c) => c.color === movedPlayer.color
    ).length
    // If the move just made was a bear-off and this brings the total to 15, end the game
    const lastMoveKind = playResult.move && playResult.move.moveKind
    // Debug output for win condition
    // console.log('[DEBUG] playerCheckersOff:', playerCheckersOff)
    // console.log('[DEBUG] lastMoveKind:', lastMoveKind)
    // console.log('[DEBUG] playerOff.checkers:', JSON.stringify(playerOff.checkers))
    if (playerCheckersOff === 15 && lastMoveKind === 'bear-off') {
      // Player has borne off all checkers, they win
      const winner = Player.initialize(
        movedPlayer.color,
        movedPlayer.direction,
        movedPlayer.dice,
        movedPlayer.id,
        'winner',
        true
      )
      return {
        ...game,
        stateKind: 'completed',
        winner,
        board,
        activePlayer: winner,
        activePlay: updatedActivePlay,
      } as any // TODO: type as BackgammonGameCompleted
    }
    // --- END WIN CONDITION CHECK ---

    return {
      ...game,
      stateKind: 'moving',
      board,
      activePlayer: movedPlayer,
      activePlay: updatedActivePlay,
    } as BackgammonGameMoving
  }

  public static activePlayer = function activePlayer(
    game: BackgammonGame
  ): BackgammonPlayerActive {
    const activePlayer = game.players.find(
      (p) => p.color === game.activeColor && p.stateKind !== 'inactive'
    )
    if (!activePlayer) {
      throw new Error('Active player not found')
    }
    return activePlayer as BackgammonPlayerActive
  }

  public static inactivePlayer = function inactivePlayer(
    game: BackgammonGame
  ): BackgammonPlayerInactive {
    const inactivePlayer = game.players.find(
      (p) => p.color !== game.activeColor && p.stateKind === 'inactive'
    )
    if (!inactivePlayer) {
      throw new Error('Inactive player not found')
    }
    return inactivePlayer as BackgammonPlayerInactive
  }

  public static getPlayersForColor = function getPlayersForColor(
    players: BackgammonPlayers,
    color: BackgammonColor
  ): [
    activePlayerForColor: BackgammonPlayerActive,
    inactivePlayerForColor: BackgammonPlayerInactive
  ] {
    const activePlayerForColor = players.find((p) => p.color === color)
    const inactivePlayerForColor = players.find((p) => p.color !== color)
    if (!activePlayerForColor || !inactivePlayerForColor) {
      throw new Error('Players not found')
    }
    return [
      activePlayerForColor as BackgammonPlayerActive,
      inactivePlayerForColor as BackgammonPlayerInactive,
    ]
  }

  private static sanityCheckMovingGame = (
    game: BackgammonGame
  ): BackgammonGameMoving | false => {
    if (game.stateKind !== 'moving') return false
    return game as BackgammonGameMoving
  }

  public static startMove = function startMove(
    game: BackgammonGameRolled,
    movingPlay: BackgammonPlayMoving
  ): BackgammonGameMoving {
    return {
      ...game,
      stateKind: 'moving',
      activePlay: movingPlay,
      activePlayer: Player.toMoving(game.activePlayer),
    } as BackgammonGameMoving
  }

  // --- Doubling Cube Logic ---

  public static canOfferDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Only before rolling, and only if player does not own the cube and cube is not maxxed or already offered
    return (
      (game.stateKind === 'rolling' || game.stateKind === 'rolled-for-start') &&
      game.cube.stateKind !== 'maxxed' &&
      game.cube.stateKind !== 'offered' &&
      (!game.cube.owner || game.cube.owner.id !== player.id)
    )
  }

  public static offerDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canOfferDouble(game, player))
      throw new Error('Cannot offer double')
    // Set cube to 'offered' state and transition to 'doubling' game state
    // Find the opponent
    const opponent = game.players.find((p) => p.id !== player.id)!
    // Convert players to correct types
    const activePlayer = Player.initialize(
      player.color,
      player.direction,
      player.dice,
      player.id,
      'doubled',
      true
    )
    const inactivePlayer = opponent as BackgammonPlayerInactive
    // Create a BackgammonPlayDoubled (for now, reuse activePlay)
    const activePlay = game.activePlay as any // TODO: ensure correct type
    return {
      ...game,
      stateKind: 'doubling',
      cube: {
        ...game.cube,
        stateKind: 'offered',
        owner: player,
        value: game.cube.value
          ? (game.cube.value as Exclude<typeof game.cube.value, undefined>)
          : 2,
        offeredBy: player,
      },
      activePlayer,
      inactivePlayer,
      activePlay,
      activeColor: player.color,
    } as any // TODO: type as BackgammonGameDoubling
  }

  public static canAcceptDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Only if cube is in 'offered' state and player is not the one who offered
    return (
      game.cube.stateKind === 'offered' &&
      game.cube.offeredBy &&
      game.cube.offeredBy.id !== player.id
    )
  }

  public static acceptDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canAcceptDouble(game, player))
      throw new Error('Cannot accept double')
    // Double the cube value, transfer ownership to accepting player, clear offeredBy, set to 'doubled' or 'maxxed'
    const nextValue = Math.min(
      game.cube.value ? game.cube.value * 2 : 2,
      64
    ) as typeof game.cube.value
    const offeringPlayer = game.cube.offeredBy!
    // Convert players to correct types
    const activePlayer = Player.initialize(
      player.color,
      player.direction,
      player.dice,
      player.id,
      'doubled',
      true
    )
    const inactivePlayer = Player.initialize(
      offeringPlayer.color,
      offeringPlayer.direction,
      offeringPlayer.dice,
      offeringPlayer.id,
      'inactive',
      true
    )
    // Create a BackgammonPlayDoubled (for now, reuse activePlay)
    const activePlay = game.activePlay as any // TODO: ensure correct type
    if (nextValue === 64) {
      // If maxxed, game should be completed
      const winner = Player.initialize(
        player.color,
        player.direction,
        player.dice,
        player.id,
        'winner',
        true
      )
      return {
        ...game,
        stateKind: 'completed',
        winner,
        cube: {
          ...game.cube,
          stateKind: 'maxxed',
          owner: undefined,
          value: 64,
          offeredBy: undefined,
        },
      } as any // TODO: type as BackgammonGameCompleted
    }
    return {
      ...game,
      stateKind: 'doubled',
      cube: {
        ...game.cube,
        stateKind: 'doubled',
        owner: player,
        value: nextValue,
        offeredBy: undefined,
      },
      activePlayer,
      inactivePlayer,
      activePlay,
      activeColor: player.color,
    } as any // TODO: type as BackgammonGameDoubled
  }

  public static canRefuseDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): boolean {
    // Only if cube is in 'offered' state and player is not the one who offered
    return Game.canAcceptDouble(game, player)
  }

  public static refuseDouble(
    game: BackgammonGame,
    player: BackgammonPlayerActive
  ): BackgammonGame {
    if (!Game.canRefuseDouble(game, player))
      throw new Error('Cannot refuse double')
    // The refusing player loses at the current cube value
    // The offering player is the winner
    const offeringPlayer = game.cube.offeredBy!
    const winner = Player.initialize(
      offeringPlayer.color,
      offeringPlayer.direction,
      offeringPlayer.dice,
      offeringPlayer.id,
      'winner',
      true
    )
    return {
      ...game,
      stateKind: 'completed',
      winner,
    } as any // TODO: type as BackgammonGameCompleted
  }
}

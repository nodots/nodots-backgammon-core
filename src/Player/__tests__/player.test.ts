import { beforeEach, describe, expect, it } from '@jest/globals'
import {
  BackgammonBoard,
  BackgammonColor,
  BackgammonDiceRolled,
  BackgammonMoveDirection,
  BackgammonPlayer,
  BackgammonPlayerRolling,
  BackgammonPoint,
  BackgammonPlayers,
  BackgammonMoveReady,
} from '@nodots-llc/backgammon-types/dist'
import { Player } from '..'
import { Board } from '../..'
// import * as gnubgApi from '@nodots-llc/backgammon-ai'
// import {
//   FurthestFromOffMoveAnalyzer,
//   RandomMoveAnalyzer,
// } from '@nodots-llc/backgammon-ai'

// jest.mock('nodots-backgammon-ai/dist/nodots-backgammon-ai/src/gnubgApi')

describe('Player', () => {
  let player: BackgammonPlayer
  let board: BackgammonBoard
  const color: BackgammonColor = 'white'
  const direction: BackgammonMoveDirection = 'clockwise'

  beforeEach(() => {
    player = Player.initialize(
      color,
      direction,
      undefined,
      undefined,
      'inactive',
      true
    )
    board = Board.initialize()
  })

  describe('initialize', () => {
    it('should initialize a player with default state', () => {
      expect(player).toBeDefined()
      expect(player.color).toBe(color)
      expect(player.direction).toBe(direction)
      expect(player.stateKind).toBe('inactive')
      expect(player.pipCount).toBe(167)
      expect(player.dice).toBeDefined()
    })

    it('should initialize a player with specified state', () => {
      const rollingPlayer = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'rolling',
        true
      ) as BackgammonPlayerRolling
      expect(rollingPlayer.stateKind).toBe('rolling')
    })

    it('should initialize a winner player with 0 pip count', () => {
      const winnerPlayer = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'winner',
        true
      )
      expect(winnerPlayer.stateKind).toBe('winner')
      expect(winnerPlayer.pipCount).toBe(0)
    })

    it('should initialize a player with moved state', () => {
      const movedPlayer = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'moved',
        true
      )
      expect(movedPlayer.stateKind).toBe('moved')
      expect(movedPlayer.pipCount).toBe(167)
    })
  })

  describe('roll', () => {
    it('should roll dice and update player state', () => {
      const rollingPlayer = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'rolling',
        true
      ) as BackgammonPlayerRolling
      const rolledPlayer = Player.roll(rollingPlayer)

      expect(rolledPlayer.stateKind).toBe('rolled')
      expect(
        (rolledPlayer.dice as BackgammonDiceRolled).currentRoll
      ).toBeDefined()
      expect(
        (rolledPlayer.dice as BackgammonDiceRolled).currentRoll!.length
      ).toBe(2)
    })
  })

  describe('getHomeBoard', () => {
    it('should return correct home board points for clockwise direction', () => {
      const homeBoard = Player.getHomeBoard(board, player)
      expect(homeBoard.length).toBe(6)
      homeBoard.forEach((point) => {
        expect(
          (point as BackgammonPoint).position.clockwise
        ).toBeGreaterThanOrEqual(19)
        expect(
          (point as BackgammonPoint).position.clockwise
        ).toBeLessThanOrEqual(24)
      })
    })

    it('should return correct home board points for counterclockwise direction', () => {
      const counterClockwisePlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        undefined,
        'inactive',
        true
      )
      const homeBoard = Player.getHomeBoard(board, counterClockwisePlayer)
      expect(homeBoard.length).toBe(6)
      homeBoard.forEach((point) => {
        expect(
          (point as BackgammonPoint).position.counterclockwise
        ).toBeGreaterThanOrEqual(1)
        expect(
          (point as BackgammonPoint).position.counterclockwise
        ).toBeLessThanOrEqual(6)
      })
    })
  })

  describe('getOpponentBoard', () => {
    it('should return correct opponent board points for clockwise direction', () => {
      const opponentBoard = Player.getOpponentBoard(board, player)
      expect(opponentBoard.length).toBe(6)
      expect(opponentBoard[0].position.clockwise).toBe(1)
      expect(opponentBoard[5].position.clockwise).toBe(6)
    })

    it('should return correct opponent board points for counterclockwise direction', () => {
      const counterClockwisePlayer = Player.initialize(
        'black',
        'counterclockwise',
        undefined,
        undefined,
        'inactive',
        true
      )
      const opponentBoard = Player.getOpponentBoard(
        board,
        counterClockwisePlayer
      )
      expect(opponentBoard.length).toBe(6)
      expect(opponentBoard[0].position.clockwise).toBe(19)
      expect(opponentBoard[5].position.clockwise).toBe(24)
    })
  })

  describe('getBestMove', () => {
    it('should get a move from possible ready moves', async () => {
      const playerMoving = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'moving',
        true
      ) as import('@nodots-llc/backgammon-types/dist').BackgammonPlayerMoving
      // Use a valid BackgammonPoint from the board as origin
      const origin1 = board.points[0]
      const origin2 = board.points[1]
      const moves = new Set<
        import('@nodots-llc/backgammon-types/dist').BackgammonMoveReady
      >([
        {
          id: 'move1',
          player: playerMoving,
          dieValue: 3,
          stateKind: 'ready',
          moveKind: 'point-to-point',
          origin: origin1,
        } as unknown as import('@nodots-llc/backgammon-types/dist').BackgammonMoveReady,
        {
          id: 'move2',
          player: playerMoving,
          dieValue: 4,
          stateKind: 'ready',
          moveKind: 'point-to-point',
          origin: origin2,
        } as unknown as import('@nodots-llc/backgammon-types/dist').BackgammonMoveReady,
      ])
      const playMoving: import('@nodots-llc/backgammon-types/dist').BackgammonPlayMoving =
        {
          id: 'play1',
          player: playerMoving,
          board,
          moves,
          stateKind: 'moving',
        }
      const move = await Player.getBestMove(playMoving, 'random')
      expect(move).toBeDefined()
      expect(['move1', 'move2']).toContain(move!.id)
      expect(move!.stateKind).toBe('ready')
    })

    it('should return undefined if no moves are available', async () => {
      const playerMoving = Player.initialize(
        color,
        direction,
        undefined,
        undefined,
        'moving',
        true
      ) as import('@nodots-llc/backgammon-types/dist').BackgammonPlayerMoving
      const playMoving: import('@nodots-llc/backgammon-types/dist').BackgammonPlayMoving =
        {
          id: 'play2',
          player: playerMoving,
          board,
          moves: new Set<BackgammonMoveReady>(),
          stateKind: 'moving',
        }
      const move = await Player.getBestMove(playMoving)
      expect(move).toBeUndefined()
    })
  })

  // describe('getBestMove failover', () => {
  //   const color = 'white'
  //   const direction = 'clockwise'
  //   let playerMoving: import('@nodots-llc/backgammon-types/dist').BackgammonPlayerMoving
  //   let board: import('@nodots-llc/backgammon-types/dist').BackgammonBoard
  //   let origin1: any, origin2: any
  //   let playMoving: import('@nodots-llc/backgammon-types/dist').BackgammonPlayMoving

  //   beforeEach(() => {
  //     board = Board.initialize()
  //     playerMoving = Player.initialize(
  //       color,
  //       direction,
  //       undefined,
  //       undefined,
  //       'moving',
  //       true
  //     ) as import('@nodots-llc/backgammon-types/dist').BackgammonPlayerMoving
  //     origin1 = board.points[0]
  //     origin2 = board.points[1]
  //     const moves = new Set<
  //       import('@nodots-llc/backgammon-types/dist').BackgammonMoveReady
  //     >([
  //       {
  //         id: 'move1',
  //         player: playerMoving,
  //         dieValue: 6,
  //         stateKind: 'ready',
  //         moveKind: 'point-to-point',
  //         origin: origin1,
  //       } as unknown as import('@nodots-llc/backgammon-types/dist').BackgammonMoveReady,
  //       {
  //         id: 'move2',
  //         player: playerMoving,
  //         dieValue: 1,
  //         stateKind: 'ready',
  //         moveKind: 'point-to-point',
  //         origin: origin2,
  //       } as unknown as import('@nodots-llc/backgammon-types/dist').BackgammonMoveReady,
  //     ])
  //     playMoving = {
  //       id: 'play1',
  //       player: playerMoving,
  //       board,
  //       moves,
  //       stateKind: 'moving',
  //     }
  //   })

  //   it('should select the best move using gnubg strategy', async () => {
  //     jest
  //       .spyOn(gnubgApi, 'getBestMoveFromGnubg')
  //       .mockImplementation((moves) => Promise.resolve(moves[0]))
  //     const result = await Player.getBestMove(playMoving, 'gnubg')
  //     expect(result).toBeDefined()
  //     expect(result!.id).toBe('move1')
  //   })

  //   it('should select the best move using gnubg strategy with fallback', async () => {
  //     jest
  //       .spyOn(gnubgApi, 'getBestMoveFromGnubg')
  //       .mockRejectedValue(new Error('GNUbg is not available'))
  //     jest
  //       .spyOn(RandomMoveAnalyzer.prototype, 'analyze')
  //       .mockImplementation((moves) => Promise.resolve(moves[1]))

  //     const result = await Player.getBestMove(playMoving, 'gnubg')
  //     expect(result).toBeDefined()
  //     expect(result!.id).toBe('move2')
  //   })
  // })
})

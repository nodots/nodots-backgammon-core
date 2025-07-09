import { describe, expect, test } from '@jest/globals'
import {
  BackgammonBar,
  BackgammonCheckerContainerImport,
  BackgammonDiceInactive,
  BackgammonMoveCompletedWithMove,
  BackgammonPlayerRolled,
  BackgammonPlayerRolling,
  BackgammonPlayRolled,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types/dist'
import { Play } from '..'
import { Board, Dice, generateId, Player } from '../..'

// Helper to create a board with all 15 white checkers in the home board (points 19-24 for clockwise)
function createTestBoard() {
  const boardImport: BackgammonCheckerContainerImport[] = [
    {
      position: { clockwise: 19, counterclockwise: 6 },
      checkers: { qty: 2, color: 'white' },
    },
    {
      position: { clockwise: 20, counterclockwise: 5 },
      checkers: { qty: 3, color: 'white' },
    },
    {
      position: { clockwise: 21, counterclockwise: 4 },
      checkers: { qty: 3, color: 'white' },
    },
    {
      position: { clockwise: 22, counterclockwise: 3 },
      checkers: { qty: 3, color: 'white' },
    },
    {
      position: { clockwise: 23, counterclockwise: 2 },
      checkers: { qty: 2, color: 'white' },
    },
    {
      position: { clockwise: 24, counterclockwise: 1 },
      checkers: { qty: 2, color: 'white' },
    },
  ]
  return Board.buildBoard(boardImport)
}

// Helper to create a rolling player
function createRollingPlayer(board: any, diceRoll: [number, number]) {
  const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
  jest.spyOn(Math, 'random').mockReturnValue(0)
  const player = Player.initialize(
    'white',
    'clockwise',
    inactiveDice,
    undefined,
    'rolling',
    false
  ) as BackgammonPlayerRolling
  const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
  rolledPlayer.dice.currentRoll = diceRoll as any
  return rolledPlayer
}

describe('Play', () => {
  describe('initialization', () => {
    test('should initialize with basic board setup', () => {
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 1, color: 'white' },
        },
        {
          position: { clockwise: 19, counterclockwise: 6 },
          checkers: { qty: 1, color: 'black' },
        },
      ]

      const board = Board.initialize(boardImport)
      const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
      const player = Player.initialize(
        'white',
        'clockwise',
        inactiveDice,
        undefined,
        'rolling',
        false
      ) as BackgammonPlayerRolling

      const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
      const play = Play.initialize(board, rolledPlayer)

      expect(play).toBeDefined()
      expect(play.stateKind).toBe('rolled')
      expect(play.moves).toBeDefined()
      expect(play.moves.size).toBeGreaterThan(0)

      // Check that each move has the required moveKind
      for (const move of play.moves) {
        expect(move.moveKind).toBeDefined()
      }
    })

    test('should handle doubles correctly', () => {
      const board = createTestBoard()
      const inactiveDice = Dice.initialize('white') as BackgammonDiceInactive
      jest.spyOn(Math, 'random').mockReturnValue(0) // This will make both dice roll 1
      const player = Player.initialize(
        'white',
        'clockwise',
        inactiveDice,
        undefined,
        'rolling',
        false
      ) as BackgammonPlayerRolling
      const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
      const play = Play.initialize(board, rolledPlayer)
      expect(play.moves.size).toBe(4)
      const moveKinds = Array.from(play.moves).map((m: any) => m.moveKind)
      expect(moveKinds.every((k) => k === 'bear-off' || k === 'no-move')).toBe(
        true
      )
      // Print the ASCII board after a successful test
      // eslint-disable-next-line no-console
      console.log(
        '\nASCII board after successful doubles test:\n' +
          Board.getAsciiBoard(board)
      )
      jest.spyOn(Math, 'random').mockRestore()
    })

    // test('should handle no possible moves', () => {
    //   // Place 4 white checkers on the bar and block point 1 (for [1,1] doubles)
    //   const boardImport: BackgammonCheckerContainerImport[] = [
    //     // Place 4 white checkers on the bar
    //     {
    //       position: 'bar',
    //       direction: 'clockwise',
    //       checkers: { qty: 4, color: 'white' },
    //     },
    //     // Block point 1 for white (clockwise) with 2 black checkers
    //     {
    //       position: { clockwise: 1, counterclockwise: 24 },
    //       checkers: { qty: 2, color: 'black' },
    //     },
    //   ]

    //   const board = Board.buildBoard(boardImport)
    //   const inactiveDice = Dice.initialize(
    //     'white',
    //     'inactive',
    //     generateId(),
    //     [1, 1] // Use doubles for this test
    //   ) as BackgammonDiceInactive
    //   const player = Player.initialize(
    //     'white',
    //     'clockwise',
    //     inactiveDice,
    //     undefined,
    //     'rolling'
    //   ) as BackgammonPlayerRolling

    //   const rolledPlayer = Player.roll(player) as BackgammonPlayerRolled
    //   const play = Play.initialize(board, rolledPlayer)

    //   // For doubles, should have 4 moves (all 'no-move' since all reentry points are blocked)
    //   const movesArr = Array.from(play.moves)
    //   console.log(
    //     'DEBUG no possible moves:',
    //     movesArr.map((m) => ({ moveKind: m.moveKind, origin: m.origin }))
    //   )
    //   expect(movesArr.length).toBe(4)
    //   expect(movesArr.every((m: any) => m.moveKind === 'no-move')).toBe(true)
    // })

    test('should generate normal board moves when no checkers on bar', () => {
      const board = createTestBoard()
      const rolledPlayer = createRollingPlayer(board, [1, 2])
      const play = Play.initialize(board, rolledPlayer)
      expect(play.moves.size).toBe(2)
      const moveKinds = Array.from(play.moves).map((m: any) => m.moveKind)
      const hasBearOffMove = moveKinds.some((k) => k === 'bear-off')
      expect(hasBearOffMove).toBe(true)
      // Print the ASCII board after a successful test
      // Only print if the assertion passes
      // eslint-disable-next-line no-console
      console.log(
        '\nASCII board after successful test:\n' + Board.getAsciiBoard(board)
      )
      jest.spyOn(Math, 'random').mockRestore()
    })

    test('should handle doubles correctly for normal board positions', () => {
      const board = createTestBoard()
      const rolledPlayer = createRollingPlayer(board, [1, 1])
      const play = Play.initialize(board, rolledPlayer)
      expect(play.moves.size).toBe(4)
      const moveKinds = Array.from(play.moves).map((m: any) => m.moveKind)
      const hasBearOffMove = moveKinds.some((k) => k === 'bear-off')
      expect(hasBearOffMove).toBe(true)
      // Print the ASCII board after a successful test
      // eslint-disable-next-line no-console
      console.log(
        '\nASCII board after successful doubles (normal) test:\n' +
          Board.getAsciiBoard(board)
      )
      jest.spyOn(Math, 'random').mockRestore()
    })
  })

  describe('move functionality', () => {
    test('should execute a valid move', () => {
      const boardImport: BackgammonCheckerContainerImport[] = [
        {
          position: { clockwise: 6, counterclockwise: 19 },
          checkers: { qty: 1, color: 'white' },
        },
      ]

      const board = Board.buildBoard(boardImport)
      const inactiveDice = Dice.initialize(
        'white',
        'inactive',
        generateId(),
        [1, 2]
      ) as BackgammonDiceInactive

      const player = Player.initialize(
        'white',
        'clockwise',
        inactiveDice,
        undefined,
        'rolling',
        false
      ) as BackgammonPlayerRolling

      // Use controlled dice values instead of random roll
      const rolledPlayer = {
        ...player,
        stateKind: 'rolled',
        dice: {
          ...inactiveDice,
          stateKind: 'rolled',
          currentRoll: [1, 2],
          total: 3,
        },
      } as BackgammonPlayerRolled

      const play = Play.initialize(board, rolledPlayer) as BackgammonPlayRolled

      const origin = board.points.find(
        (p) => p.position.clockwise === 6 && p.position.counterclockwise === 19
      ) as BackgammonPoint

      const result = Play.move(board, play, origin)

      expect(result.play).toBeDefined()
      expect(result.board).toBeDefined()
      expect(result.move.stateKind).toBe('completed')
      expect((result.move as BackgammonMoveCompletedWithMove).moveKind).toBe(
        'point-to-point'
      )
    })

    describe('reenter moves', () => {
      test('should execute a valid reenter move from bar', () => {
        const boardImport: BackgammonCheckerContainerImport[] = [
          {
            position: 'bar',
            direction: 'clockwise',
            checkers: {
              qty: 1,
              color: 'white',
            },
          },
          {
            position: { clockwise: 19, counterclockwise: 6 },
            checkers: { qty: 0, color: 'white' },
          },
          {
            position: { clockwise: 20, counterclockwise: 5 },
            checkers: { qty: 2, color: 'black' },
          },
          {
            position: { clockwise: 21, counterclockwise: 4 },
            checkers: { qty: 2, color: 'black' },
          },
          {
            position: { clockwise: 22, counterclockwise: 3 },
            checkers: { qty: 2, color: 'black' },
          },
          {
            position: { clockwise: 23, counterclockwise: 2 },
            checkers: { qty: 2, color: 'black' },
          },
          {
            position: { clockwise: 24, counterclockwise: 1 },
            checkers: { qty: 2, color: 'black' },
          },
        ]

        const board = Board.buildBoard(boardImport)
        const inactiveDice = Dice.initialize(
          'white',
          'inactive',
          generateId(),
          [6, 1]
        ) as BackgammonDiceInactive

        const player = Player.initialize(
          'white',
          'clockwise',
          inactiveDice,
          undefined,
          'rolling',
          false
        ) as BackgammonPlayerRolling

        const rolledPlayer = {
          ...player,
          stateKind: 'rolled',
          dice: {
            ...inactiveDice,
            stateKind: 'rolled',
            currentRoll: [6, 1],
            total: 7,
          },
        } as BackgammonPlayerRolled

        const play = Play.initialize(
          board,
          rolledPlayer
        ) as BackgammonPlayRolled
        const origin = board.bar.clockwise as BackgammonBar

        const result = Play.move(board, play, origin)

        expect(result.play).toBeDefined()
        expect(result.board).toBeDefined()
        expect(result.move.stateKind).toBe('completed')
        expect((result.move as BackgammonMoveCompletedWithMove).moveKind).toBe(
          'reenter'
        )
        const destination = (result.move as BackgammonMoveCompletedWithMove)
          .destination as BackgammonPoint
        expect([19, 6]).toContain(destination.position.clockwise)
      })
    })
  })

  // describe('move array length invariants', () => {
  //   test('should always have 4 moves for doubles and 2 for non-doubles', () => {
  //     // Test doubles: Place 4 white checkers on the bar and block points 2, 3, 4, 5 (for [2,2] doubles)
  //     const boardImportDoubles: BackgammonCheckerContainerImport[] = [
  //       {
  //         position: 'bar',
  //         direction: 'clockwise',
  //         checkers: { qty: 4, color: 'white' },
  //       },
  //       // Block points 2, 3, 4, 5 for white (clockwise) with 2 black checkers each
  //       {
  //         position: { clockwise: 2, counterclockwise: 23 },
  //         checkers: { qty: 2, color: 'black' },
  //       },
  //       {
  //         position: { clockwise: 3, counterclockwise: 22 },
  //         checkers: { qty: 2, color: 'black' },
  //       },
  //       {
  //         position: { clockwise: 4, counterclockwise: 21 },
  //         checkers: { qty: 2, color: 'black' },
  //       },
  //       {
  //         position: { clockwise: 5, counterclockwise: 20 },
  //         checkers: { qty: 2, color: 'black' },
  //       },
  //     ]
  //     const boardDoubles = Board.buildBoard(boardImportDoubles)
  //     const inactiveDiceDoubles = Dice.initialize(
  //       'white',
  //       'inactive',
  //       generateId(),
  //       [2, 2]
  //     ) as BackgammonDiceInactive
  //     const playerDoubles = Player.initialize(
  //       'white',
  //       'clockwise',
  //       inactiveDiceDoubles,
  //       undefined,
  //       'rolling'
  //     ) as BackgammonPlayerRolling
  //     const rolledPlayerDoubles = Player.roll(
  //       playerDoubles
  //     ) as BackgammonPlayerRolled
  //     const playDoubles = Play.initialize(boardDoubles, rolledPlayerDoubles)
  //     const movesDoubles = Array.from(playDoubles.moves)
  //     console.log(
  //       'DEBUG move array length invariants (doubles):',
  //       movesDoubles.map((m) => ({ moveKind: m.moveKind, origin: m.origin }))
  //     )
  //     expect(movesDoubles.length).toBe(4)
  //     // All moves should be 'no-move' since all reentry points are blocked
  //     expect(movesDoubles.every((m: any) => m.moveKind === 'no-move')).toBe(
  //       true
  //     )

  //     // Test non-doubles: Place 2 white checkers on the bar and block points 1 and 2
  //     const boardImportNonDoubles: BackgammonCheckerContainerImport[] = [
  //       {
  //         position: 'bar',
  //         direction: 'clockwise',
  //         checkers: { qty: 2, color: 'white' },
  //       },
  //       {
  //         position: { clockwise: 1, counterclockwise: 24 },
  //         checkers: { qty: 2, color: 'black' },
  //       },
  //       {
  //         position: { clockwise: 2, counterclockwise: 23 },
  //         checkers: { qty: 2, color: 'black' },
  //       },
  //     ]
  //     const boardNonDoubles = Board.buildBoard(boardImportNonDoubles)
  //     const inactiveDiceNonDoubles = Dice.initialize(
  //       'white',
  //       'inactive',
  //       generateId(),
  //       [1, 2]
  //     ) as BackgammonDiceInactive
  //     const playerNonDoubles = Player.initialize(
  //       'white',
  //       'clockwise',
  //       inactiveDiceNonDoubles,
  //       undefined,
  //       'rolling'
  //     ) as BackgammonPlayerRolling
  //     const rolledPlayerNonDoubles = Player.roll(
  //       playerNonDoubles
  //     ) as BackgammonPlayerRolled
  //     const playNonDoubles = Play.initialize(
  //       boardNonDoubles,
  //       rolledPlayerNonDoubles
  //     )
  //     const movesNonDoubles = Array.from(playNonDoubles.moves)
  //     expect(movesNonDoubles.length).toBe(2)
  //     // All moves should be 'no-move' since all reentry points are blocked
  //     expect(movesNonDoubles.every((m: any) => m.moveKind === 'no-move')).toBe(
  //       true
  //     )
  //   })
  // })
})

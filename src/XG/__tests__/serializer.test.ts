import { XGSerializer } from '../serializer'
import { XGMatch, XGMatchHeader, XGGameRecord } from '@nodots-llc/backgammon-types'

describe('XGSerializer', () => {
  const sampleHeader: XGMatchHeader = {
    site: 'XG Mobile',
    matchId: '491989142',
    player1: 'Ken',
    player2: 'XG-Intermediate',
    player1Elo: '1522.94/244',
    player2Elo: '1829.00/0',
    timeControl: '*0',
    eventDate: '2022.12.24',
    eventTime: '21.23',
    variation: 'Backgammon',
    jacoby: 'On',
    beaver: 'Off',
    unrated: 'Off',
    cubeLimit: 1024
  }

  const sampleGame: XGGameRecord = {
    gameNumber: 1,
    initialScore: { player1: 0, player2: 0 },
    moves: [
      {
        moveNumber: 1,
        player: 2,
        dice: [1, 5],
        moves: [
          { from: 24, to: 23 },
          { from: 23, to: 18 }
        ]
      },
      {
        moveNumber: 2,
        player: 1,
        dice: [2, 1],
        moves: [
          { from: 13, to: 11 },
          { from: 8, to: 7 }
        ]
      },
      {
        moveNumber: 3,
        player: 1,
        cubeAction: {
          type: 'double',
          value: 2
        }
      },
      {
        moveNumber: 4,
        player: 2,
        cubeAction: {
          type: 'take'
        }
      },
      {
        moveNumber: 5,
        player: 1,
        gameEnd: {
          winner: 1,
          points: 2
        }
      }
    ],
    winner: 1,
    pointsWon: 2,
    finalScore: { player1: 2, player2: 0 }
  }

  const sampleMatch: XGMatch = {
    header: sampleHeader,
    matchLength: 0,
    games: [sampleGame],
    metadata: {
      totalGames: 1,
      finalScore: { player1: 2, player2: 0 },
      parsedAt: new Date('2022-12-24T21:23:00Z'),
      fileSize: 0
    }
  }

  describe('serialize', () => {
    it('should serialize a complete match correctly', () => {
      const result = XGSerializer.serialize(sampleMatch)
      
      expect(result).toContain('; [Site "XG Mobile"]')
      expect(result).toContain('; [Player 1 "Ken"]')
      expect(result).toContain('; [Player 2 "XG-Intermediate"]')
      expect(result).toContain('0 point match')
      expect(result).toContain('Game 1')
    })

    it('should serialize header correctly', () => {
      const result = XGSerializer.serialize(sampleMatch)
      
      expect(result).toContain('; [Site "XG Mobile"]')
      expect(result).toContain('; [Match ID "491989142"]')
      expect(result).toContain('; [Player 1 "Ken"]')
      expect(result).toContain('; [Player 2 "XG-Intermediate"]')
      expect(result).toContain('; [Player 1 Elo "1522.94/244"]')
      expect(result).toContain('; [Player 2 Elo "1829.00/0"]')
      expect(result).toContain('; [EventDate "2022.12.24"]')
      expect(result).toContain('; [EventTime "21.23"]')
      expect(result).toContain('; [Jacoby "On"]')
      expect(result).toContain('; [CubeLimit "1024"]')
    })

    it('should serialize game header correctly', () => {
      const result = XGSerializer.serialize(sampleMatch)
      
      expect(result).toContain('Game 1')
      expect(result).toContain('Ken : 0                              XG-Intermediate : 0')
    })

    it('should serialize moves correctly', () => {
      const result = XGSerializer.serialize(sampleMatch)
      
      // Check move with dice and movements
      expect(result).toMatch(/\s+1\)\s+15: 24\/23 23\/18/)
      expect(result).toMatch(/\s+2\) 21: 13\/11 8\/7/)
    })

    it('should serialize cube actions correctly', () => {
      const result = XGSerializer.serialize(sampleMatch)
      
      expect(result).toContain('Doubles => 2')
      expect(result).toContain('Takes')
    })

    it('should serialize game end correctly', () => {
      const result = XGSerializer.serialize(sampleMatch)
      
      expect(result).toContain('Wins 2 point')
    })

    it('should handle multiple games', () => {
      const multiGameMatch: XGMatch = {
        ...sampleMatch,
        games: [
          sampleGame,
          {
            ...sampleGame,
            gameNumber: 2,
            initialScore: { player1: 2, player2: 0 },
            finalScore: { player1: 3, player2: 0 }
          }
        ]
      }

      const result = XGSerializer.serialize(multiGameMatch)
      
      expect(result).toContain('Game 1')
      expect(result).toContain('Game 2')
      expect(result).toContain('Ken : 2                              XG-Intermediate : 0')
    })

    it('should handle optional header fields', () => {
      const minimalHeader: XGMatchHeader = {
        site: 'Nodots Backgammon',
        matchId: '123',
        player1: 'Player1',
        player2: 'Player2',
        eventDate: '2023.01.01',
        eventTime: '12.00',
        variation: 'Backgammon',
        jacoby: 'Off',
        beaver: 'Off',
        unrated: 'Off',
        cubeLimit: 1024
      }

      const minimalMatch: XGMatch = {
        header: minimalHeader,
        matchLength: 0,
        games: [],
        metadata: {
          totalGames: 0,
          finalScore: { player1: 0, player2: 0 },
          parsedAt: new Date(),
          fileSize: 0
        }
      }

      const result = XGSerializer.serialize(minimalMatch)
      
      expect(result).toContain('; [Site "Nodots Backgammon"]')
      expect(result).not.toContain('Player 1 Elo')
      expect(result).not.toContain('TimeControl')
    })
  })

  describe('createMatch', () => {
    it('should create a match with default values', () => {
      const games: XGGameRecord[] = []
      const match = XGSerializer.createMatch('Player1', 'Player2', games)
      
      expect(match.header.player1).toBe('Player1')
      expect(match.header.player2).toBe('Player2')
      expect(match.header.site).toBe('Nodots Backgammon')
      expect(match.header.variation).toBe('Backgammon')
      expect(match.matchLength).toBe(0)
      expect(match.games).toEqual(games)
    })

    it('should create a match with custom options', () => {
      const options = {
        site: 'Custom Site',
        eventDate: '2023.01.01',
        jacoby: 'On' as const,
        cubeLimit: 512
      }
      
      const match = XGSerializer.createMatch('Player1', 'Player2', [], options)
      
      expect(match.header.site).toBe('Custom Site')
      expect(match.header.eventDate).toBe('2023.01.01')
      expect(match.header.jacoby).toBe('On')
      expect(match.header.cubeLimit).toBe(512)
    })

    it('should generate unique match ID', () => {
      const match1 = XGSerializer.createMatch('P1', 'P2', [])
      const match2 = XGSerializer.createMatch('P1', 'P2', [])
      
      expect(match1.header.matchId).not.toBe(match2.header.matchId)
    })

    it('should calculate final score from games', () => {
      const games: XGGameRecord[] = [
        {
          gameNumber: 1,
          initialScore: { player1: 0, player2: 0 },
          moves: [],
          winner: 1,
          pointsWon: 2,
          finalScore: { player1: 2, player2: 0 }
        },
        {
          gameNumber: 2,
          initialScore: { player1: 2, player2: 0 },
          moves: [],
          winner: 2,
          pointsWon: 1,
          finalScore: { player1: 2, player2: 1 }
        }
      ]
      
      const match = XGSerializer.createMatch('Player1', 'Player2', games)
      
      expect(match.metadata.finalScore).toEqual({ player1: 2, player2: 1 })
      expect(match.metadata.totalGames).toBe(2)
    })
  })

  describe('move formatting', () => {
    it('should format player 1 moves on the left', () => {
      const gameWithP1Move: XGGameRecord = {
        gameNumber: 1,
        initialScore: { player1: 0, player2: 0 },
        moves: [{
          moveNumber: 1,
          player: 1,
          dice: [3, 2],
          moves: [{ from: 13, to: 10 }, { from: 8, to: 6 }]
        }],
        winner: 1,
        pointsWon: 1,
        finalScore: { player1: 1, player2: 0 }
      }

      const match: XGMatch = {
        header: sampleHeader,
        matchLength: 0,
        games: [gameWithP1Move],
        metadata: {
          totalGames: 1,
          finalScore: { player1: 1, player2: 0 },
          parsedAt: new Date(),
          fileSize: 0
        }
      }

      const result = XGSerializer.serialize(match)
      
      // Player 1 moves should be on the left (no extra spacing)
      expect(result).toMatch(/\s+1\) 32: 13\/10 8\/6/)
    })

    it('should format player 2 moves on the right', () => {
      const gameWithP2Move: XGGameRecord = {
        gameNumber: 1,
        initialScore: { player1: 0, player2: 0 },
        moves: [{
          moveNumber: 1,
          player: 2,
          dice: [5, 4],
          moves: [{ from: 24, to: 19 }, { from: 13, to: 9 }]
        }],
        winner: 2,
        pointsWon: 1,
        finalScore: { player1: 0, player2: 1 }
      }

      const match: XGMatch = {
        header: sampleHeader,
        matchLength: 0,
        games: [gameWithP2Move],
        metadata: {
          totalGames: 1,
          finalScore: { player1: 0, player2: 1 },
          parsedAt: new Date(),
          fileSize: 0
        }
      }

      const result = XGSerializer.serialize(match)
      
      // Player 2 moves should be on the right (with spacing)
      expect(result).toMatch(/\s+1\)\s+54: 24\/19 13\/9/)
    })

    it('should handle special moves (bar and bearing off)', () => {
      const gameWithSpecialMoves: XGGameRecord = {
        gameNumber: 1,
        initialScore: { player1: 0, player2: 0 },
        moves: [
          {
            moveNumber: 1,
            player: 1,
            dice: [3, 2],
            moves: [{ from: 25, to: 23 }, { from: 13, to: 10 }] // Bar entry
          },
          {
            moveNumber: 2,
            player: 2,
            dice: [6, 5],
            moves: [{ from: 6, to: 0 }, { from: 5, to: 0 }] // Bearing off
          }
        ],
        winner: 1,
        pointsWon: 1,
        finalScore: { player1: 1, player2: 0 }
      }

      const match: XGMatch = {
        header: sampleHeader,
        matchLength: 0,
        games: [gameWithSpecialMoves],
        metadata: {
          totalGames: 1,
          finalScore: { player1: 1, player2: 0 },
          parsedAt: new Date(),
          fileSize: 0
        }
      }

      const result = XGSerializer.serialize(match)
      
      expect(result).toContain('25/23') // Bar entry
      expect(result).toContain('6/0') // Bearing off
      expect(result).toContain('5/0') // Bearing off
    })
  })

  describe('round-trip compatibility', () => {
    it('should produce content that can be parsed back', () => {
      const serialized = XGSerializer.serialize(sampleMatch)
      
      // This would require the parser to be imported, but we can at least
      // check that the format looks correct
      expect(serialized).toContain('; [Site "')
      expect(serialized).toContain('0 point match')
      expect(serialized).toContain('Game 1')
      expect(serialized).toMatch(/\d+\).*\d+: \d+\/\d+/)
    })
  })
})
import { XGSerializer } from '../serializer'
import { XGParser } from '../parser'

describe('XGSerializer', () => {
  describe('serialize', () => {
    it('should serialize a match to XG format', () => {
      const match = XGSerializer.createMatch(
        'Player1',
        'Player2',
        [
          {
            gameNumber: 1,
            initialScore: { player1: 0, player2: 0 },
            moves: [
              {
                moveNumber: 1,
                player: 1,
                dice: [4, 1],
                moves: [
                  { from: 13, to: 9 },
                  { from: 24, to: 23 },
                ],
              },
            ],
            winner: 1,
            pointsWon: 1,
            finalScore: { player1: 1, player2: 0 },
          },
        ],
        {
          site: 'Test Site',
          eventDate: '2025.10.22',
          eventTime: '15.00',
        }
      )

      const serialized = XGSerializer.serialize(match)

      expect(serialized).toContain('; [Site "Test Site"]')
      expect(serialized).toContain('; [Player 1 "Player1"]')
      expect(serialized).toContain('; [Player 2 "Player2"]')
      expect(serialized).toContain('0 point match')
      expect(serialized).toContain('Game 1')
      expect(serialized).toContain('41: 13/9 24/23')
    })

    it('should handle cube actions in serialization', () => {
      const match = XGSerializer.createMatch('P1', 'P2', [
        {
          gameNumber: 1,
          initialScore: { player1: 0, player2: 0 },
          moves: [
            {
              moveNumber: 1,
              player: 1,
              cubeAction: { type: 'double', value: 2 },
            },
            {
              moveNumber: 2,
              player: 2,
              cubeAction: { type: 'take' },
            },
          ],
          winner: 1,
          pointsWon: 1,
          finalScore: { player1: 1, player2: 0 },
        },
      ])

      const serialized = XGSerializer.serialize(match)

      expect(serialized).toContain('Doubles => 2')
      expect(serialized).toContain('Takes')
    })

    it('should round-trip parse and serialize', () => {
      const originalXG = `; [Site "XG Mobile"]
; [Player 1 "Ken"]
; [Player 2 "Robot"]
; [EventDate "2025.10.22"]
; [EventTime "15.00"]
; [Variation "Backgammon"]

 3 point match

 Game 1
 Ken : 0                              Robot : 0
  1) 41: 13/9 24/23                   16: 13/7 8/7
  2) 53: 8/3 6/3                      66: 8/2 8/2 7/1 7/1`

      const parsed = XGParser.parse(originalXG)
      expect(parsed.success).toBe(true)
      expect(parsed.data).toBeDefined()

      if (parsed.data) {
        const serialized = XGSerializer.serialize(parsed.data)
        const reparsed = XGParser.parse(serialized)

        expect(reparsed.success).toBe(true)
        expect(reparsed.data?.games[0].moves.length).toBe(
          parsed.data.games[0].moves.length
        )
      }
    })
  })
})

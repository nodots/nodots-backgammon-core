import { XGParser } from '../parser'
import { XGSerializer } from '../serializer'
import { XGConverter } from '../converter'
import * as fs from 'fs'
import * as path from 'path'

describe('XG Integration Tests', () => {
  describe('Round-trip conversion', () => {
    it('should parse and re-serialize to equivalent XG format', () => {
      const originalXG = `; [Site "XG Mobile"]
; [Player 1 "Ken"]
; [Player 2 "XG-Professional"]
; [EventDate "2025.09.19"]
; [EventTime "00.00"]
; [Variation "Backgammon"]

 3 point match

 Game 1
 Ken : 0                              XG-Professional : 0
  1)                                  16: 13/7 8/7
  2) 41: 13/9 24/23                   11: 24/23 23/22 6/5 6/5
  3) 53: 8/3 6/3                      66: 8/2 8/2 7/1 7/1`

      const parsed = XGParser.parse(originalXG)
      expect(parsed.success).toBe(true)
      expect(parsed.data).toBeDefined()

      if (parsed.data) {
        const serialized = XGSerializer.serialize(parsed.data)
        const reparsed = XGParser.parse(serialized)

        expect(reparsed.success).toBe(true)
        expect(reparsed.data?.header.player1).toBe('Ken')
        expect(reparsed.data?.header.player2).toBe('XG-Professional')
        expect(reparsed.data?.matchLength).toBe(3)
        expect(reparsed.data?.games).toHaveLength(1)
        expect(reparsed.data?.games[0].moves.length).toBe(parsed.data.games[0].moves.length)
      }
    })

    it('should handle doubles correctly in round-trip', () => {
      const xgWithDoubles = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2025.10.22"]
; [EventTime "15.00"]
; [Variation "Backgammon"]

 0 point match

 Game 1
 Player1 : 0                              Player2 : 0
  1) 33: 6/3 6/3 5/2 5/2              66: 8/2 8/2 7/1 7/1
  2) 44: 13/9 13/9 9/5 9/5            55: 25/20 20/15 15/10 13/8`

      const parsed = XGParser.parse(xgWithDoubles)
      expect(parsed.success).toBe(true)

      if (parsed.data) {
        const serialized = XGSerializer.serialize(parsed.data)
        const reparsed = XGParser.parse(serialized)

        expect(reparsed.success).toBe(true)
        expect(reparsed.data?.games[0].moves[0].dice).toEqual([3, 3])
        expect(reparsed.data?.games[0].moves[0].moves).toHaveLength(4)
        expect(reparsed.data?.games[0].moves[1].dice).toEqual([6, 6])
        expect(reparsed.data?.games[0].moves[1].moves).toHaveLength(4)
      }
    })

    it('should handle cube actions in round-trip', () => {
      const xgWithCube = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2025.10.22"]
; [EventTime "15.00"]
; [Variation "Backgammon"]

 0 point match

 Game 1
 Player1 : 0                              Player2 : 0
  1) 41: 13/9 24/23                   Doubles => 2
  2)  Takes                           16: 13/7 8/7
  3) 53: 8/3 6/3                      Drops`

      const parsed = XGParser.parse(xgWithCube)
      expect(parsed.success).toBe(true)

      if (parsed.data) {
        const serialized = XGSerializer.serialize(parsed.data)
        const reparsed = XGParser.parse(serialized)

        expect(reparsed.success).toBe(true)

        const moves = reparsed.data?.games[0].moves || []
        const doubleMove = moves.find(m => m.cubeAction?.type === 'double')
        const takeMove = moves.find(m => m.cubeAction?.type === 'take')
        const dropMove = moves.find(m => m.cubeAction?.type === 'drop')

        expect(doubleMove).toBeDefined()
        expect(doubleMove?.cubeAction?.value).toBe(2)
        expect(takeMove).toBeDefined()
        expect(dropMove).toBeDefined()
      }
    })
  })

  describe('XG to Nodots game conversion', () => {
    it('should convert XG game to Nodots game structure', async () => {
      const xg = `; [Site "XG Mobile"]
; [Player 1 "Ken"]
; [Player 2 "Robot"]
; [EventDate "2025.10.22"]
; [EventTime "15.00"]
; [Variation "Backgammon"]
; [Jacoby "On"]
; [Beaver "Off"]

 0 point match

 Game 1
 Ken : 0                              Robot : 0
  1) 41: 13/9 24/23                   16: 13/7 8/7`

      const parsed = XGParser.parse(xg)
      expect(parsed.success).toBe(true)

      if (parsed.data) {
        const game = await XGConverter.xgGameToNodotsGame(
          parsed.data.games[0],
          parsed.data.header
        )

        expect(game).toBeDefined()
        expect(game.players).toHaveLength(2)
        expect(game.rules?.useJacobyRule).toBe(true)
        expect(game.rules?.useBeaverRule).toBe(false)
      }
    })

    it('should preserve XG data for round-trip conversion', async () => {
      const xg = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2025.10.22"]
; [EventTime "15.00"]
; [Variation "Backgammon"]

 0 point match

 Game 1
 Player1 : 0                              Player2 : 0
  1) 41: 13/9 24/23                   16: 13/7 8/7
  2)                                   Wins 1 point`

      const parsed = XGParser.parse(xg)
      expect(parsed.success).toBe(true)

      if (parsed.data) {
        const xgGame = parsed.data.games[0]
        const nodotsGame = await XGConverter.xgGameToNodotsGame(xgGame, parsed.data.header)

        // Check that XG data is preserved for round-trip conversion
        expect(nodotsGame._xgData).toBeDefined()
        expect(nodotsGame._xgData.gameNumber).toBe(1)
        expect(nodotsGame._xgData.winner).toBe(2)
        expect(nodotsGame._xgData.pointsWon).toBe(1)
      }
    })
  })

  describe('Error handling', () => {
    it('should handle malformed XG files gracefully', () => {
      const malformedXG = `; [Site "XG Mobile"]
This is not valid XG format
Random text here`

      const result = XGParser.parse(malformedXG)
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle missing required headers', () => {
      const incompleteXG = `; [Site "XG Mobile"]
; [Player 1 "Player1"]

 0 point match`

      const result = XGParser.parse(incompleteXG)
      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.message.includes('required'))).toBe(true)
    })

    it('should validate dice values', () => {
      // Parser should reject invalid dice (7 is not a valid die value)
      const invalidDiceXG = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2025.10.22"]
; [EventTime "15.00"]
; [Variation "Backgammon"]

 0 point match

 Game 1
 Player1 : 0                              Player2 : 0
  1) 71: 13/6                         16: 13/7 8/7`

      const result = XGParser.parse(invalidDiceXG)
      // Parser should fail or skip the invalid move
      expect(result.success).toBe(false)
    })
  })

  describe('Real file testing', () => {
    const samplesDir = path.join(process.cwd(), 'xgmobilesavedgames')

    it('should parse real XG Mobile sample file if available', () => {
      if (!fs.existsSync(samplesDir)) {
        console.log('Skipping real file test - samples directory not found')
        return
      }

      const sampleFile = 'Ken - XG-Professional 3 point match Sep 19 2025.txt'
      const samplePath = path.join(samplesDir, sampleFile)

      if (!fs.existsSync(samplePath)) {
        console.log('Skipping real file test - sample file not found')
        return
      }

      const content = fs.readFileSync(samplePath, 'utf-8')
      const result = XGParser.parse(content)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()

      if (result.data) {
        expect(result.data.header.player1).toBe('Ken')
        expect(result.data.header.player2).toBe('XG-Professional')
        expect(result.data.matchLength).toBe(3)
        expect(result.data.games.length).toBeGreaterThan(0)
      }
    })
  })

  describe('Move validation', () => {
    it('should validate basic XG move structure', () => {
      expect(XGConverter.validateXGMove({ from: 13, to: 9 })).toBe(true)
      expect(XGConverter.validateXGMove({ from: 24, to: 23 })).toBe(true)
      expect(XGConverter.validateXGMove({ from: 25, to: 20 })).toBe(true) // Bar to point
      expect(XGConverter.validateXGMove({ from: 6, to: 0 })).toBe(true) // Bear off
    })

    it('should reject invalid XG moves', () => {
      expect(XGConverter.validateXGMove({ from: 13, to: 13 })).toBe(false) // Same position
      expect(XGConverter.validateXGMove({ from: -1, to: 9 })).toBe(false) // Invalid from
      expect(XGConverter.validateXGMove({ from: 13, to: 26 })).toBe(false) // Invalid to
      expect(XGConverter.validateXGMove({ from: 0, to: 25 })).toBe(false) // Invalid transition
    })
  })
})

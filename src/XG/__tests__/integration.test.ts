import { XGParser } from '../parser'
import { XGSerializer } from '../serializer'
import { XGService } from '../index'

describe('XG Integration Tests', () => {
  const sampleXGContent = `; [Site "XG Mobile"]
; [Match ID "491989142"]
; [Player 1 "Ken"]
; [Player 2 "XG-Intermediate"]
; [Player 1 Elo "1522.94/244"]
; [Player 2 Elo "1829.00/0"]
; [TimeControl "*0"]
; [EventDate "2022.12.24"]
; [EventTime "21.23"]
; [Variation "Backgammon"]
; [Jacoby "On"]
; [Beaver "Off"]
; [Unrated "Off"]
; [CubeLimit "1024"]

0 point match

Game 1 
Ken : 0                              XG-Intermediate : 0 
 1)                                  15: 24/23 23/18
 2) 21: 13/11 8/7                    64: 25/21 24/18
 3) 41: 25/24 11/7                   51: 25/20 21/20
 4)  Doubles => 2                     Takes
 5) 42: 13/9 9/7                     65: 13/8 13/7
 6)  Wins 2 point

Game 2 
Ken : 2                              XG-Intermediate : 0 
 1) 33: 8/5 8/5 6/3 6/3              22: 24/22 24/22 13/11 13/11
 2) 62: 25/23 23/17                  51: 25/20 13/12
 3)  Drops                           
 4)  Wins 1 point`

  describe('Round-trip conversion', () => {
    it('should parse and then serialize back to similar format', () => {
      // Parse the content
      const parseResult = XGParser.parse(sampleXGContent)
      expect(parseResult.success).toBe(true)
      expect(parseResult.data).toBeDefined()

      // Serialize it back
      const serialized = XGSerializer.serialize(parseResult.data!)
      
      // Basic structure checks
      expect(serialized).toContain('; [Site "XG Mobile"]')
      expect(serialized).toContain('; [Player 1 "Ken"]')
      expect(serialized).toContain('; [Player 2 "XG-Intermediate"]')
      expect(serialized).toContain('0 point match')
      expect(serialized).toContain('Game 1')
      expect(serialized).toContain('Game 2')
      
      // Check that key moves are preserved
      expect(serialized).toContain('15: 24/23 23/18')
      expect(serialized).toContain('21: 13/11 8/7')
      expect(serialized).toContain('Doubles => 2')
      expect(serialized).toContain('Takes')
      expect(serialized).toContain('Drops')
      expect(serialized).toContain('Wins 2 point')
      expect(serialized).toContain('Wins 1 point')
    })

    it('should maintain game structure integrity', () => {
      const parseResult = XGParser.parse(sampleXGContent)
      const match = parseResult.data!
      
      expect(match.games).toHaveLength(2)
      
      // Game 1 checks
      expect(match.games[0].gameNumber).toBe(1)
      expect(match.games[0].initialScore).toEqual({ player1: 0, player2: 0 })
      expect(match.games[0].winner).toBe(1)
      expect(match.games[0].pointsWon).toBe(2)
      expect(match.games[0].finalScore).toEqual({ player1: 2, player2: 0 })
      
      // Game 2 checks
      expect(match.games[1].gameNumber).toBe(2)
      expect(match.games[1].initialScore).toEqual({ player1: 2, player2: 0 })
      expect(match.games[1].winner).toBe(1)
      expect(match.games[1].pointsWon).toBe(1)
      expect(match.games[1].finalScore).toEqual({ player1: 3, player2: 0 })
      
      // Metadata checks
      expect(match.metadata.totalGames).toBe(2)
      expect(match.metadata.finalScore).toEqual({ player1: 3, player2: 0 })
    })

    it('should preserve move details correctly', () => {
      const parseResult = XGParser.parse(sampleXGContent)
      const game1 = parseResult.data!.games[0]
      
      // Check specific moves
      const firstMove = game1.moves[0]
      expect(firstMove.moveNumber).toBe(1)
      expect(firstMove.player).toBe(2)
      expect(firstMove.dice).toEqual([1, 5])
      expect(firstMove.moves).toEqual([
        { from: 24, to: 23 },
        { from: 23, to: 18 }
      ])
      
      // Check cube actions
      const doubleMove = game1.moves.find(m => m.cubeAction?.type === 'double')
      expect(doubleMove).toBeDefined()
      expect(doubleMove!.cubeAction).toEqual({ type: 'double', value: 2 })
      
      const takeMove = game1.moves.find(m => m.cubeAction?.type === 'take')
      expect(takeMove).toBeDefined()
      expect(takeMove!.cubeAction).toEqual({ type: 'take' })
    })
  })

  describe('XGService integration', () => {
    it('should import XG file correctly', async () => {
      const result = await XGService.importXGFile(sampleXGContent)
      
      expect(result.success).toBe(true)
      expect(result.games).toHaveLength(2)
      expect(result.errors).toHaveLength(0)
      expect(result.metadata).toBeDefined()
      expect(result.metadata!.totalGames).toBe(2)
    })

    it('should validate XG file correctly', () => {
      const result = XGService.validateXGFile(sampleXGContent)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.errors).toHaveLength(0)
    })

    it('should get file stats correctly', () => {
      const stats = XGService.getXGFileStats(sampleXGContent)
      
      expect(stats.valid).toBe(true)
      expect(stats.gameCount).toBe(2)
      expect(stats.playerNames).toEqual(['Ken', 'XG-Intermediate'])
      expect(stats.fileSize).toBe(sampleXGContent.length)
      expect(stats.errors).toHaveLength(0)
    })

    it('should handle invalid content gracefully', async () => {
      const invalidContent = 'This is not XG format'
      
      const importResult = await XGService.importXGFile(invalidContent)
      expect(importResult.success).toBe(false)
      expect(importResult.games).toHaveLength(0)
      expect(importResult.errors.length).toBeGreaterThan(0)
      
      const validateResult = XGService.validateXGFile(invalidContent)
      expect(validateResult.success).toBe(false)
      
      const stats = XGService.getXGFileStats(invalidContent)
      expect(stats.valid).toBe(false)
      expect(stats.gameCount).toBe(0)
      expect(stats.playerNames).toBeNull()
    })

    it('should create simple XG match correctly', () => {
      const gameResults = [
        { winner: 1 as const, points: 2 },
        { winner: 2 as const, points: 1 },
        { winner: 1 as const, points: 1 }
      ]
      
      const xgContent = XGService.createSimpleXGMatch(
        'Player1',
        'Player2',
        gameResults,
        { site: 'Test Site' }
      )
      
      expect(xgContent).toContain('; [Site "Test Site"]')
      expect(xgContent).toContain('; [Player 1 "Player1"]')
      expect(xgContent).toContain('; [Player 2 "Player2"]')
      expect(xgContent).toContain('Game 1')
      expect(xgContent).toContain('Game 2')
      expect(xgContent).toContain('Game 3')
      expect(xgContent).toContain('Wins 2 point')
      expect(xgContent).toContain('Wins 1 point')
    })
  })

  describe('Error handling and edge cases', () => {
    it('should handle malformed move notation', () => {
      const malformedContent = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2022.01.01"]
; [EventTime "12.00"]
; [Variation "Backgammon"]

0 point match

Game 1
Player1 : 0                          Player2 : 0
 1) 21: invalid/move/notation        15: 24/23 23/18
 2)  Wins 1 point`
      
      const result = XGParser.parse(malformedContent)
      
      // Should still parse successfully but might have warnings
      expect(result.success).toBe(true)
      expect(result.data?.games).toHaveLength(1)
    })

    it('should handle games with only cube actions', () => {
      const cubeOnlyContent = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2022.01.01"]
; [EventTime "12.00"]
; [Variation "Backgammon"]

0 point match

Game 1
Player1 : 0                          Player2 : 0
 1)  Doubles => 2                     Drops
 2)  Wins 2 point`
      
      const result = XGParser.parse(cubeOnlyContent)
      
      expect(result.success).toBe(true)
      expect(result.data?.games[0].moves).toHaveLength(3) // Double, Drop, Win
    })

    it('should handle very large files efficiently', () => {
      // Create a large XG content with many games
      let largeContent = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2022.01.01"]
; [EventTime "12.00"]
; [Variation "Backgammon"]

0 point match

`
      
      // Add 100 simple games
      for (let i = 1; i <= 100; i++) {
        largeContent += `Game ${i}
Player1 : ${i - 1}                          Player2 : 0
 1) 21: 13/11 8/7                   15: 24/23 23/18
 2)  Wins 1 point

`
      }
      
      const startTime = Date.now()
      const result = XGParser.parse(largeContent)
      const parseTime = Date.now() - startTime
      
      expect(result.success).toBe(true)
      expect(result.data?.games).toHaveLength(100)
      expect(parseTime).toBeLessThan(1000) // Should parse in under 1 second
    })
  })

  describe('Real-world compatibility', () => {
    it('should handle different XG software variations', () => {
      // Test content that might come from different XG implementations
      const gnuBgContent = `; [Recorder "GNU Backgammon"]  
; [Site "GNU Backgammon"]
; [Player 1 "Human"]
; [Player 2 "GNU"]
; [EventDate "2023.01.01"]
; [EventTime "14.30"]
; [Variation "Backgammon"]

0 point match

Game 1
Human : 0                            GNU : 0
 1) 52: 13/8 24/22                   64: 24/18 13/9
 2)  Wins 1 point`
      
      const result = XGParser.parse(gnuBgContent)
      
      expect(result.success).toBe(true)
      expect(result.data?.header.site).toBe('GNU Backgammon')
      expect(result.data?.games).toHaveLength(1)
    })

    it('should handle match play format (when supported)', () => {
      const matchContent = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2022.01.01"]
; [EventTime "12.00"]
; [Variation "Backgammon"]

5 point match

Game 1
Player1 : 0                          Player2 : 0
 1) 21: 13/11 8/7                   15: 24/23 23/18
 2)  Wins 1 point`
      
      const result = XGParser.parse(matchContent)
      
      expect(result.success).toBe(true)
      expect(result.data?.matchLength).toBe(5)
    })
  })
})
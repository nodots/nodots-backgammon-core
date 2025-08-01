import { XGParser } from '../parser'
import { XGParseResult } from '@nodots-llc/backgammon-types'

describe('XGParser', () => {
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
 6)  Wins 1 point

Game 2
Ken : 1                              XG-Intermediate : 0
 1) 33: 8/5 8/5 6/3 6/3              22: 24/22 24/22 13/11 13/11
 2)  Wins 2 point`

  describe('parse', () => {
    it('should successfully parse a valid XG file', () => {
      const result: XGParseResult = XGParser.parse(sampleXGContent)
      
      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.errors).toHaveLength(0)
    })

    it('should parse header correctly', () => {
      const result = XGParser.parse(sampleXGContent)
      
      expect(result.data?.header).toEqual({
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
      })
    })

    it('should parse match length correctly', () => {
      const result = XGParser.parse(sampleXGContent)
      
      expect(result.data?.matchLength).toBe(0)
    })

    it('should parse games correctly', () => {
      const result = XGParser.parse(sampleXGContent)
      
      expect(result.data?.games).toHaveLength(2)
      
      const game1 = result.data?.games[0]
      expect(game1?.gameNumber).toBe(1)
      expect(game1?.initialScore).toEqual({ player1: 0, player2: 0 })
      expect(game1?.winner).toBe(1)
      expect(game1?.pointsWon).toBe(1)
    })

    it('should parse moves correctly', () => {
      const result = XGParser.parse(sampleXGContent)
      const game1 = result.data?.games[0]
      
      expect(game1?.moves).toBeDefined()
      expect(game1?.moves.length).toBeGreaterThan(0)
      
      // Check first move
      const firstMove = game1?.moves[0]
      expect(firstMove?.moveNumber).toBe(1)
      expect(firstMove?.player).toBe(2) // Player 2 starts (move number 1 is odd, but this is player 2's move)
      expect(firstMove?.dice).toEqual([1, 5])
      expect(firstMove?.moves).toEqual([
        { from: 24, to: 23 },
        { from: 23, to: 18 }
      ])
    })

    it('should parse cube actions correctly', () => {
      const result = XGParser.parse(sampleXGContent)
      const game1 = result.data?.games[0]
      
      // Find the double action
      const doubleMove = game1?.moves.find(m => m.cubeAction?.type === 'double')
      expect(doubleMove).toBeDefined()
      expect(doubleMove?.cubeAction).toEqual({
        type: 'double',
        value: 2
      })
      
      // Find the take action
      const takeMove = game1?.moves.find(m => m.cubeAction?.type === 'take')
      expect(takeMove).toBeDefined()
      expect(takeMove?.cubeAction).toEqual({
        type: 'take'
      })
    })

    it('should handle empty content', () => {
      const result = XGParser.parse('')
      
      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toBe('Empty file')
    })

    it('should handle malformed header', () => {
      const malformedContent = `; [Site "XG Mobile"
; [Player 1 "Ken"]
0 point match`
      
      const result = XGParser.parse(malformedContent)
      
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle missing required fields', () => {
      const incompleteContent = `; [Site "XG Mobile"]
; [Player 1 "Ken"]
0 point match`
      
      const result = XGParser.parse(incompleteContent)
      
      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.message.includes('Missing required header field'))).toBe(true)
    })

    it('should parse dice notation correctly', () => {
      const result = XGParser.parse(sampleXGContent)
      const game1 = result.data?.games[0]
      
      // Check various dice combinations
      const moveWith21 = game1?.moves.find(m => m.dice?.[0] === 2 && m.dice?.[1] === 1)
      expect(moveWith21).toBeDefined()
      
      const moveWith64 = game1?.moves.find(m => m.dice?.[0] === 6 && m.dice?.[1] === 4)
      expect(moveWith64).toBeDefined()
    })

    it('should parse move notation correctly', () => {
      const result = XGParser.parse(sampleXGContent)
      const game1 = result.data?.games[0]
      
      // Find move with multiple checker movements
      const moveWith21 = game1?.moves.find(m => 
        m.dice?.[0] === 2 && m.dice?.[1] === 1 && m.moves
      )
      
      expect(moveWith21?.moves).toEqual([
        { from: 13, to: 11 },
        { from: 8, to: 7 }
      ])
    })

    it('should handle special positions (bar and off)', () => {
      const contentWithSpecialMoves = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2022.01.01"]
; [EventTime "12.00"]
; [Variation "Backgammon"]

0 point match

Game 1
Player1 : 0                          Player2 : 0
 1) 32: 25/23 13/10                  55: 6/1 6/1 6/1 5/0
 2)  Wins 1 point`
      
      const result = XGParser.parse(contentWithSpecialMoves)
      
      expect(result.success).toBe(true)
      const game = result.data?.games[0]
      
      // Check bar entry (25 to point)
      const barMove = game?.moves.find(m => m.moves?.some(move => move.from === 25))
      expect(barMove).toBeDefined()
      
      // Check bearing off (point to 0)
      const bearOffMove = game?.moves.find(m => m.moves?.some(move => move.to === 0))
      expect(bearOffMove).toBeDefined()
    })

    it('should calculate metadata correctly', () => {
      const result = XGParser.parse(sampleXGContent)
      
      expect(result.data?.metadata).toBeDefined()
      expect(result.data?.metadata.totalGames).toBe(2)
      expect(result.data?.metadata.finalScore).toEqual({ player1: 3, player2: 0 })
      expect(result.data?.metadata.fileSize).toBe(sampleXGContent.length)
      expect(result.data?.metadata.parsedAt).toBeInstanceOf(Date)
    })
  })

  describe('error handling', () => {
    it('should handle invalid dice format', () => {
      const contentWithInvalidDice = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2022.01.01"]
; [EventTime "12.00"]
; [Variation "Backgammon"]

0 point match

Game 1
Player1 : 0                          Player2 : 0
 1) ABC: 13/11 8/7                   15: 24/23 23/18
 2)  Wins 1 point`
      
      const result = XGParser.parse(contentWithInvalidDice)
      
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should handle unexpected parsing errors gracefully', () => {
      // This should not throw an exception
      const result = XGParser.parse(null as any)
      
      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('edge cases', () => {
    it('should handle games with no moves', () => {
      const emptyGameContent = `; [Site "XG Mobile"]
; [Player 1 "Player1"]  
; [Player 2 "Player2"]
; [EventDate "2022.01.01"]
; [EventTime "12.00"]
; [Variation "Backgammon"]

0 point match

Game 1
Player1 : 0                          Player2 : 0
 1)  Wins 1 point`
      
      const result = XGParser.parse(emptyGameContent)
      
      expect(result.success).toBe(true)
      expect(result.data?.games[0].moves).toHaveLength(1)
    })

    it('should handle multiple spaces in move notation', () => {
      const spacedContent = `; [Site "XG Mobile"]
; [Player 1 "Player1"]
; [Player 2 "Player2"]
; [EventDate "2022.01.01"]
; [EventTime "12.00"]
; [Variation "Backgammon"]

0 point match

Game 1
Player1 : 0                          Player2 : 0
 1) 21:   13/11    8/7               15: 24/23 23/18
 2)  Wins 1 point`
      
      const result = XGParser.parse(spacedContent)
      
      expect(result.success).toBe(true)
      const move = result.data?.games[0].moves[0]
      expect(move?.moves).toEqual([
        { from: 13, to: 11 },
        { from: 8, to: 7 }
      ])
    })
  })
})
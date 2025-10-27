import { XGParser } from '../parser'
import { XGParseResult } from '@nodots-llc/backgammon-types'
import fs from 'fs'
import path from 'path'

describe('XGParser', () => {
  describe('parse', () => {
    it('should parse a simple XG format game', () => {
      const xgContent = `; [Site "XG Mobile"]
; [Match ID "591900044"]
; [Player 1 "Ken"]
; [Player 2 "XG-Professional"]
; [Player 1 Elo "1575.05/808"]
; [Player 2 Elo "2228.00/0"]
; [TimeControl "*0"]
; [EventDate "2025.09.19"]
; [EventTime "00.00"]
; [Variation "Backgammon"]
; [Crawford "On"]
; [Unrated "Off"]
; [CubeLimit "1024"]

 3 point match

 Game 1
 Ken : 0                              XG-Professional : 0
  1)                                  16: 13/7 8/7
  2) 41: 13/9 24/23                   11: 24/23 23/22 6/5 6/5
  3) 53: 8/3 6/3                      66:
 29)                                   Wins 4 point`

      const result = XGParser.parse(xgContent)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data?.header.player1).toBe('Ken')
      expect(result.data?.header.player2).toBe('XG-Professional')
      expect(result.data?.matchLength).toBe(3)
      expect(result.data?.games).toHaveLength(1)
      expect(result.data?.games[0].gameNumber).toBe(1)
    })

    it('should handle empty input', () => {
      const result = XGParser.parse('')

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].message).toContain('Empty file')
    })

    it('should handle missing required headers', () => {
      const xgContent = `; [Site "XG Mobile"]
; [Player 1 "Ken"]

 3 point match`

      const result = XGParser.parse(xgContent)

      expect(result.success).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should parse dice notation correctly', () => {
      const xgContent = `; [Site "XG Mobile"]
; [Player 1 "Ken"]
; [Player 2 "XG-Pro"]
; [EventDate "2025.09.19"]
; [EventTime "00.00"]
; [Variation "Backgammon"]

 0 point match

 Game 1
 Ken : 0                              XG-Pro : 0
  1) 41: 13/9 24/23                   16: 13/7 8/7`

      const result = XGParser.parse(xgContent)

      expect(result.success).toBe(true)
      const move1 = result.data?.games[0].moves[0]
      expect(move1?.dice).toEqual([4, 1])
      expect(move1?.moves).toHaveLength(2)
      expect(move1?.moves?.[0].from).toBe(13)
      expect(move1?.moves?.[0].to).toBe(9)
    })

    it('should parse cube actions correctly', () => {
      const xgContent = `; [Site "XG Mobile"]
; [Player 1 "Ken"]
; [Player 2 "XG-Pro"]
; [EventDate "2025.09.19"]
; [EventTime "00.00"]
; [Variation "Backgammon"]

 0 point match

 Game 1
 Ken : 0                              XG-Pro : 0
  1) 41: 13/9 24/23                   Doubles => 2
  2)  Takes                           16: 13/7 8/7`

      const result = XGParser.parse(xgContent)

      expect(result.success).toBe(true)
      const doubleMove = result.data?.games[0].moves[1]
      expect(doubleMove?.cubeAction?.type).toBe('double')
      expect(doubleMove?.cubeAction?.value).toBe(2)

      const takeMove = result.data?.games[0].moves[2]
      expect(takeMove?.cubeAction?.type).toBe('take')
    })

    it('should parse game endings correctly', () => {
      const xgContent = `; [Site "XG Mobile"]
; [Player 1 "Ken"]
; [Player 2 "XG-Pro"]
; [EventDate "2025.09.19"]
; [EventTime "00.00"]
; [Variation "Backgammon"]

 0 point match

 Game 1
 Ken : 0                              XG-Pro : 0
  1) 41: 13/9 24/23                   16: 13/7 8/7
  2)                                   Wins 2 point`

      const result = XGParser.parse(xgContent)

      expect(result.success).toBe(true)
      const game = result.data?.games[0]
      expect(game?.winner).toBe(2)
      expect(game?.pointsWon).toBe(2)
      expect(game?.finalScore).toEqual({ player1: 0, player2: 2 })
    })

    it('should parse doubles (same dice) correctly', () => {
      const xgContent = `; [Site "XG Mobile"]
; [Player 1 "Ken"]
; [Player 2 "XG-Pro"]
; [EventDate "2025.09.19"]
; [EventTime "00.00"]
; [Variation "Backgammon"]

 0 point match

 Game 1
 Ken : 0                              XG-Pro : 0
  1) 33: 6/3 6/3 5/2 5/2              66: 8/2 8/2 7/1 7/1`

      const result = XGParser.parse(xgContent)

      expect(result.success).toBe(true)
      const move1 = result.data?.games[0].moves[0]
      expect(move1?.dice).toEqual([3, 3])
      expect(move1?.moves).toHaveLength(4)

      const move2 = result.data?.games[0].moves[1]
      expect(move2?.dice).toEqual([6, 6])
      expect(move2?.moves).toHaveLength(4)
    })
  })
})

import {
  BackgammonBoard,
  BackgammonDieValue,
  BackgammonMoveOrigin,
  BackgammonMoveSkeleton,
  BackgammonPlayer,
  BackgammonPoint,
} from '@nodots-llc/backgammon-types'
import { debug } from '../../utils/logger'
import { Board } from '../index'

// Core move calculation logic - now internal use only
const getBasicPossibleMoves = function getBasicPossibleMoves(
  board: BackgammonBoard,
  player: BackgammonPlayer,
  dieValue: BackgammonDieValue
): BackgammonMoveSkeleton[] {
  const possibleMoves: BackgammonMoveSkeleton[] = []
  const playerPoints = Board.getPoints(board).filter(
    (p: BackgammonPoint) =>
      p.checkers.length > 0 && p.checkers[0].color === player.color
  )
  const playerDirection = player.direction
  const bar = board.bar[playerDirection]

  // If player has no checkers left, return empty array
  if (playerPoints.length === 0 && bar.checkers.length === 0) {
    return possibleMoves
  }

  // If player has checkers on the bar, they must move those first
  if (bar.checkers.length > 0) {
    const reentryPoint = 25 - dieValue
    const possibleDestination = Board.getPoints(board).find(
      (p: BackgammonPoint) =>
        // Point must be empty, have only one opponent checker (hit), or have player's own checkers (stacking)
        (p.checkers.length === 0 ||
          (p.checkers.length === 1 && p.checkers[0].color !== player.color) ||
          (p.checkers.length > 0 && p.checkers[0].color === player.color)) &&
        // Point must match the reentry point for the player's direction
        p.position[playerDirection] === reentryPoint
    )
    if (possibleDestination) {
      possibleMoves.push({
        origin: bar,
        destination: possibleDestination,
        dieValue,
        direction: playerDirection,
      })
    }
    return possibleMoves
  }

  // Handle regular point-to-point moves
  playerPoints.forEach(function mapPlayerPoints(point) {
    const originPosition = point.position[playerDirection]
    const destinationPosition = originPosition - dieValue

    // Skip moves that would go off the board - these are handled by bear-off logic
    if (destinationPosition < 1 || destinationPosition > 24) {
      return
    }

    const possibleDestination = Board.getPoints(board).find(
      (p: BackgammonPoint) =>
        // Point must be empty, have only one opponent checker (hit), or have player's own checkers (stacking)
        (p.checkers.length === 0 ||
          (p.checkers.length === 1 && p.checkers[0].color !== player.color) ||
          (p.checkers.length > 0 && p.checkers[0].color === player.color)) &&
        // Point must match the destination position using the player's direction
        p.position[playerDirection] === destinationPosition
    )

    if (possibleDestination) {
      possibleMoves.push({
        origin: point,
        destination: possibleDestination,
        dieValue,
        direction: playerDirection,
      })
    }
  })

  // Bear-off logic: allow bearing off if all checkers are in the home board
  const homeBoardPoints = Board.getPoints(board).filter((p) => {
    const pos = p.position[playerDirection]
    return pos >= 1 && pos <= 6
  })

  const homeBoardPointIds = new Set(homeBoardPoints.map((p) => p.id))
  const allCheckersInHome = playerPoints.every((p) =>
    homeBoardPointIds.has(p.id)
  )

  if (allCheckersInHome) {
    // CRITICAL FIX: Proper implementation of bear-off higher die rule

    // Step 1: Find all occupied positions in home board for this player
    const occupiedPositions = homeBoardPoints
      .filter(
        (point) =>
          point.checkers.length > 0 && point.checkers[0].color === player.color
      )
      .map((point) => ({
        point,
        position: point.position[playerDirection],
      }))
      .sort((a, b) => b.position - a.position) // Sort by position desc (highest first)

    // Step 2: Check for exact match first
    const exactMatch = occupiedPositions.find((op) => op.position === dieValue)
    if (exactMatch) {
      // Direct bear-off: die matches distance exactly
      const off = board.off[playerDirection]
      possibleMoves.push({
        origin: exactMatch.point,
        destination: off,
        dieValue,
        direction: playerDirection,
      })
    } else {
      // Step 3: FIXED Higher die rule - only bear off if NO checkers exist on higher points
      // Find checkers on points higher than the die value
      const checkersOnHigherPoints = occupiedPositions.filter(
        (op) => op.position > dieValue
      )

      if (checkersOnHigherPoints.length === 0) {
        // No checkers on higher points - can use higher die rule
        // Bear off from the highest occupied point (regardless of die value)
        if (occupiedPositions.length > 0) {
          const highestOccupiedPosition = occupiedPositions[0] // Already sorted desc, so first is highest
          const off = board.off[playerDirection]
          possibleMoves.push({
            origin: highestOccupiedPosition.point,
            destination: off,
            dieValue,
            direction: playerDirection,
          })
        }
      }
      // If checkers exist on higher points, no bear-off moves are added
      // The regular point-to-point move logic above will handle moves within home board
    }
  }

  return possibleMoves
}

/**
 * Enhanced getPossibleMoves that consolidates all three previous functions
 * Always uses intelligent dice switching when possible for optimal move selection
 *
 * @param board - Current board state
 * @param player - Player making the move
 * @param dieValue - Primary die value to try
 * @param otherDieValue - Optional: Other die value for intelligent switching
 * @param origin - Optional: Specific origin for position-specific switching
 * @returns Enhanced result with moves, dice switching info, and backward compatibility
 */
export const getPossibleMoves = function getPossibleMoves(
  board: BackgammonBoard,
  player: BackgammonPlayer,
  dieValue: BackgammonDieValue,
  otherDieValue?: BackgammonDieValue,
  origin?: BackgammonMoveOrigin
): BackgammonMoveSkeleton[] | {
  moves: BackgammonMoveSkeleton[]
  usedDieValue: BackgammonDieValue
  autoSwitched: boolean
  originalDieValue: BackgammonDieValue
} {
  // Backward compatibility: when no otherDieValue provided, return simple array
  if (!otherDieValue) {
    return getBasicPossibleMoves(board, player, dieValue)
  }

  // Position-specific switching when origin is provided
  if (origin) {
    // Get all possible moves for the original die value
    const originalMoves = getBasicPossibleMoves(board, player, dieValue)

    // Check if the specific origin can move with the original die
    const originCanMoveWithOriginalDie = originalMoves.some(
      (move) => move.origin.id === origin.id
    )

    if (originCanMoveWithOriginalDie) {
      // Original die can move from this position, use it
      return {
        moves: originalMoves,
        usedDieValue: dieValue,
        autoSwitched: false,
        originalDieValue: dieValue,
      }
    }

    // Original die cannot move from this position, try the other die
    const alternativeMoves = getBasicPossibleMoves(board, player, otherDieValue)

    // Check if the specific origin can move with the alternative die
    const originCanMoveWithAlternativeDie = alternativeMoves.some(
      (move) => move.origin.id === origin.id
    )

    if (originCanMoveWithAlternativeDie) {
      // Alternative die can move from this position, auto-switch
      debug(
        'Board.getPossibleMoves: Auto-switching dice for position',
        {
          originId: origin.id,
          originalDie: dieValue,
          switchedToDie: otherDieValue,
          movesFound: alternativeMoves.length,
        }
      )
      return {
        moves: alternativeMoves,
        usedDieValue: otherDieValue,
        autoSwitched: true,
        originalDieValue: dieValue,
      }
    }

    // Neither die can move from this position, return original die with no moves
    return {
      moves: originalMoves,
      usedDieValue: dieValue,
      autoSwitched: false,
      originalDieValue: dieValue,
    }
  }

  // Standard intelligent dice switching
  // First try with the original die value
  const originalMoves = getBasicPossibleMoves(board, player, dieValue)

  if (originalMoves.length > 0) {
    // Original die has moves, use it
    return {
      moves: originalMoves,
      usedDieValue: dieValue,
      autoSwitched: false,
      originalDieValue: dieValue,
    }
  }

  // Original die has no moves, try the other die value
  const alternativeMoves = getBasicPossibleMoves(board, player, otherDieValue)

  if (alternativeMoves.length > 0) {
    // Alternative die has moves, use it (automatic dice switching)
    debug(
      'Board.getPossibleMoves: Auto-switching dice',
      {
        originalDie: dieValue,
        switchedToDie: otherDieValue,
        movesFound: alternativeMoves.length,
      }
    )
    return {
      moves: alternativeMoves,
      usedDieValue: otherDieValue,
      autoSwitched: true,
      originalDieValue: dieValue,
    }
  }

  // Neither die value has moves, return empty with original die
  return {
    moves: [],
    usedDieValue: dieValue,
    autoSwitched: false,
    originalDieValue: dieValue,
  }
}

/**
 * @deprecated Use getPossibleMoves(board, player, dieValue, otherDieValue) instead
 * This function is kept for backward compatibility during transition
 */
export const getPossibleMovesWithIntelligentDiceSwitching =
  function getPossibleMovesWithIntelligentDiceSwitching(
    board: BackgammonBoard,
    player: BackgammonPlayer,
    dieValue: BackgammonDieValue,
    otherDieValue: BackgammonDieValue
  ): {
    moves: BackgammonMoveSkeleton[]
    usedDieValue: BackgammonDieValue
    autoSwitched: boolean
    originalDieValue: BackgammonDieValue
  } {
    // Delegate to the enhanced getPossibleMoves function
    const result = getPossibleMoves(board, player, dieValue, otherDieValue)

    // Type assertion safe because we know otherDieValue is provided
    return result as {
      moves: BackgammonMoveSkeleton[]
      usedDieValue: BackgammonDieValue
      autoSwitched: boolean
      originalDieValue: BackgammonDieValue
    }
  }

/**
 * @deprecated Use getPossibleMoves(board, player, dieValue, otherDieValue, origin) instead
 * This function is kept for backward compatibility during transition
 */
export const getPossibleMovesWithPositionSpecificAutoSwitch =
  function getPossibleMovesWithPositionSpecificAutoSwitch(
    board: BackgammonBoard,
    player: BackgammonPlayer,
    origin: BackgammonMoveOrigin,
    dieValue: BackgammonDieValue,
    otherDieValue: BackgammonDieValue
  ): {
    moves: BackgammonMoveSkeleton[]
    usedDieValue: BackgammonDieValue
    autoSwitched: boolean
    originalDieValue: BackgammonDieValue
  } {
    // Delegate to the enhanced getPossibleMoves function with origin
    const result = getPossibleMoves(board, player, dieValue, otherDieValue, origin)

    // Type assertion safe because we know otherDieValue is provided
    return result as {
      moves: BackgammonMoveSkeleton[]
      usedDieValue: BackgammonDieValue
      autoSwitched: boolean
      originalDieValue: BackgammonDieValue
    }
  }

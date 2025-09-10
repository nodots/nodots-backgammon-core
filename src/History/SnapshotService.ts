import {
  BackgammonGame,
  BackgammonColor,
  GameStateSnapshot,
  BoardPositionSnapshot,
  CheckerSnapshot,
  DiceStateSnapshot,
  CubeStateSnapshot,
  PlayerStatesSnapshot,
  BackgammonPlayer,
  BackgammonDieValue,
  BackgammonGameStateKind,
} from '@nodots-llc/backgammon-types/dist'
import { logger } from '../utils/logger'

/**
 * Result types for discriminated unions
 */
type SnapshotResult<T> = 
  | { kind: 'success'; data: T }
  | { kind: 'failure'; error: string; details?: unknown }

type ValidationResult = 
  | { kind: 'valid' }
  | { kind: 'invalid'; reason: string }

type RestoreResult = 
  | { kind: 'success'; data: BackgammonGame }
  | { kind: 'failure'; error: string; details?: unknown }

type ComparisonResult = 
  | { kind: 'equal' }
  | { kind: 'different'; differences: string[] }
  | { kind: 'error'; error: string }

/**
 * SnapshotService - Functional module for game state snapshots
 * 
 * This module provides pure functions for:
 * - Creating complete, immutable snapshots of game state
 * - Restoring BackgammonGame objects from snapshots  
 * - Validating snapshot integrity and consistency
 * - Comparing snapshots for equality
 * 
 * All functions are pure and use discriminated unions for error handling
 * Board access follows CLAUDE.md patterns using player.direction
 */

/**
 * Create a complete snapshot of the current game state
 * Pure function that captures every aspect needed for perfect reconstruction
 */
export function createSnapshot(game: BackgammonGame): SnapshotResult<GameStateSnapshot> {
  try {
    const boardResult = createBoardPositionSnapshot(game)
    if (boardResult.kind === 'failure') {
      return boardResult
    }

    const diceResult = createDiceStateSnapshot(game)
    if (diceResult.kind === 'failure') {
      return diceResult
    }

    const cubeResult = createCubeStateSnapshot(game)
    if (cubeResult.kind === 'failure') {
      return cubeResult
    }

    const playersResult = createPlayerStatesSnapshot(game)
    if (playersResult.kind === 'failure') {
      return playersResult
    }

    const snapshot: GameStateSnapshot = {
      stateKind: game.stateKind,
      activeColor: game.activeColor || 'white',
      turnNumber: calculateTurnNumber(game),
      moveNumber: calculateMoveNumber(game),
      
      boardPositions: boardResult.data,
      diceState: diceResult.data,
      cubeState: cubeResult.data,
      playerStates: playersResult.data,
      
      pipCounts: {
        black: calculatePipCount(game, 'black'),
        white: calculatePipCount(game, 'white')
      },
      
      gnuPositionId: generateGnuPositionId(game)
    }

    logger.debug(`Created snapshot for game state ${game.stateKind}`, {
      turnNumber: snapshot.turnNumber,
      moveNumber: snapshot.moveNumber,
      activeColor: snapshot.activeColor
    })

    return { kind: 'success', data: snapshot }
  } catch (error) {
    logger.error('Failed to create game state snapshot', error)
    return {
      kind: 'failure',
      error: `Snapshot creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Restore a BackgammonGame object from a snapshot
 * Pure function that performs complete reconstruction to the exact state
 */
export async function restoreFromSnapshot(snapshot: GameStateSnapshot): Promise<RestoreResult> {
  try {
    logger.debug('Restoring game from snapshot', {
      stateKind: snapshot.stateKind,
      turnNumber: snapshot.turnNumber,
      activeColor: snapshot.activeColor
    })

    const validationResult = validateSnapshot(snapshot)
    if (validationResult.kind === 'invalid') {
      return {
        kind: 'failure',
        error: `Invalid snapshot: ${validationResult.reason}`
      }
    }

    // Create board from snapshot
    const boardResult = await restoreBoardFromSnapshot(snapshot.boardPositions)
    if (boardResult.kind === 'failure') {
      return boardResult
    }
    
    // Create players from snapshot
    const playersResult = await restorePlayersFromSnapshot(snapshot.playerStates, snapshot.diceState)
    if (playersResult.kind === 'failure') {
      return playersResult
    }
    
    // Create cube from snapshot
    const cubeResult = restoreCubeFromSnapshot(snapshot.cubeState)
    if (cubeResult.kind === 'failure') {
      return cubeResult
    }

    // Construct the game object (placeholder - cannot construct discriminated union directly)
    // In practice, this would use a proper factory function that respects the discriminated union structure
    const game = {
      id: '', // Would need to be provided or generated
      stateKind: snapshot.stateKind,
      activeColor: snapshot.activeColor,
      board: boardResult.data,
      players: playersResult.data,
      cube: cubeResult.data,
      activePlay: undefined, // Would need to be reconstructed based on game state
      winner: undefined, // Would be set based on completion state
      createdAt: new Date(), // Original creation time would need to be preserved
    } as BackgammonGame

    logger.info('Successfully restored game from snapshot')
    return { kind: 'success', data: game }
  } catch (error) {
    logger.error('Failed to restore game from snapshot', error)
    return {
      kind: 'failure',
      error: `Snapshot restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Validate that a snapshot is complete and consistent
 * Pure function with comprehensive validation checks
 */
export function validateSnapshot(snapshot: GameStateSnapshot): ValidationResult {
  try {
    // Check required fields
    if (!snapshot.stateKind || !snapshot.activeColor) {
      return {
        kind: 'invalid',
        reason: 'Missing required snapshot fields (stateKind or activeColor)'
      }
    }

    // Validate board positions
    const boardValidation = validateBoardPositions(snapshot.boardPositions)
    if (boardValidation.kind === 'invalid') {
      return boardValidation
    }

    // Validate dice state
    const diceValidation = validateDiceState(snapshot.diceState)
    if (diceValidation.kind === 'invalid') {
      return diceValidation
    }

    // Validate cube state
    const cubeValidation = validateCubeState(snapshot.cubeState)
    if (cubeValidation.kind === 'invalid') {
      return cubeValidation
    }

    // Validate player states
    const playerValidation = validatePlayerStates(snapshot.playerStates)
    if (playerValidation.kind === 'invalid') {
      return playerValidation
    }

    // Validate pip count consistency
    const pipValidation = validatePipCounts(snapshot)
    if (pipValidation.kind === 'invalid') {
      return pipValidation
    }

    logger.debug('Snapshot validation passed')
    return { kind: 'valid' }
  } catch (error) {
    logger.warn('Snapshot validation failed', error)
    return {
      kind: 'invalid',
      reason: `Validation error: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Compare two snapshots for equality
 * Pure function with detailed difference reporting
 */
export function compareSnapshots(snapshot1: GameStateSnapshot, snapshot2: GameStateSnapshot): ComparisonResult {
  try {
    const differences: string[] = []

    // Compare basic game state
    if (snapshot1.stateKind !== snapshot2.stateKind) {
      differences.push(`stateKind: ${snapshot1.stateKind} vs ${snapshot2.stateKind}`)
    }
    if (snapshot1.activeColor !== snapshot2.activeColor) {
      differences.push(`activeColor: ${snapshot1.activeColor} vs ${snapshot2.activeColor}`)
    }
    if (snapshot1.turnNumber !== snapshot2.turnNumber) {
      differences.push(`turnNumber: ${snapshot1.turnNumber} vs ${snapshot2.turnNumber}`)
    }
    if (snapshot1.moveNumber !== snapshot2.moveNumber) {
      differences.push(`moveNumber: ${snapshot1.moveNumber} vs ${snapshot2.moveNumber}`)
    }

    // Compare pip counts
    if (snapshot1.pipCounts.black !== snapshot2.pipCounts.black) {
      differences.push(`pipCounts.black: ${snapshot1.pipCounts.black} vs ${snapshot2.pipCounts.black}`)
    }
    if (snapshot1.pipCounts.white !== snapshot2.pipCounts.white) {
      differences.push(`pipCounts.white: ${snapshot1.pipCounts.white} vs ${snapshot2.pipCounts.white}`)
    }

    // Compare cube state
    const cubeComparison = compareCubeStates(snapshot1.cubeState, snapshot2.cubeState)
    if (cubeComparison.kind === 'different') {
      differences.push(...cubeComparison.differences.map(diff => `cube.${diff}`))
    }

    // Compare board positions
    const boardComparison = compareBoardPositions(snapshot1.boardPositions, snapshot2.boardPositions)
    if (boardComparison.kind === 'different') {
      differences.push(...boardComparison.differences.map(diff => `board.${diff}`))
    }

    // Compare dice state
    const diceComparison = compareDiceStates(snapshot1.diceState, snapshot2.diceState)
    if (diceComparison.kind === 'different') {
      differences.push(...diceComparison.differences.map(diff => `dice.${diff}`))
    }

    // Compare player states
    const playerComparison = comparePlayerStates(snapshot1.playerStates, snapshot2.playerStates)
    if (playerComparison.kind === 'different') {
      differences.push(...playerComparison.differences.map(diff => `players.${diff}`))
    }

    if (differences.length === 0) {
      return { kind: 'equal' }
    }

    return { kind: 'different', differences }
  } catch (error) {
    logger.error('Failed to compare snapshots', error)
    return {
      kind: 'error',
      error: `Comparison failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// === PURE HELPER FUNCTIONS FOR SNAPSHOT CREATION ===

/**
 * Create board position snapshot with proper player.direction access
 * FOLLOWS CLAUDE.md: Uses player.direction instead of color for board access
 */
function createBoardPositionSnapshot(game: BackgammonGame): SnapshotResult<BoardPositionSnapshot> {
  try {
    const snapshot: BoardPositionSnapshot = {
      points: {},
      bar: { black: [], white: [] },
      off: { black: [], white: [] }
    }

    // Capture all point positions
    game.board.points.forEach(point => {
      const position = point.position.clockwise.toString()
      snapshot.points[position] = point.checkers.map(checker => ({
        id: checker.id,
        color: checker.color,
        position: point.position.clockwise
      }))
    })

    // CRITICAL: Access bar and off using player.direction, not color
    const blackPlayer = getPlayerByColor(game, 'black')
    const whitePlayer = getPlayerByColor(game, 'white')

    if (!blackPlayer || !whitePlayer) {
      return {
        kind: 'failure',
        error: 'Could not find both players in game'
      }
    }

    // Bar checkers - use player.direction for correct access
    snapshot.bar.black = game.board.bar[blackPlayer.direction].checkers.map(checker => ({
      id: checker.id,
      color: checker.color,
      position: 'bar' as const
    }))

    snapshot.bar.white = game.board.bar[whitePlayer.direction].checkers.map(checker => ({
      id: checker.id,
      color: checker.color,
      position: 'bar' as const
    }))

    // Off checkers - use player.direction for correct access
    snapshot.off.black = game.board.off[blackPlayer.direction].checkers.map(checker => ({
      id: checker.id,
      color: checker.color,
      position: 'off' as const
    }))

    snapshot.off.white = game.board.off[whitePlayer.direction].checkers.map(checker => ({
      id: checker.id,
      color: checker.color,
      position: 'off' as const
    }))

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create board position snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Create dice state snapshot with proper error handling
 */
function createDiceStateSnapshot(game: BackgammonGame): SnapshotResult<DiceStateSnapshot> {
  try {
    const blackPlayer = getPlayerByColor(game, 'black')
    const whitePlayer = getPlayerByColor(game, 'white')

    if (!blackPlayer || !whitePlayer) {
      return {
        kind: 'failure',
        error: 'Could not find both players in game'
      }
    }

    const snapshot: DiceStateSnapshot = {
      black: {
        currentRoll: blackPlayer.dice?.currentRoll || undefined,
        availableMoves: getAvailableDiceValues(game, 'black'),
        usedMoves: getUsedDiceValues(game, 'black'),
        stateKind: getDiceStateKind(game, 'black')
      },
      white: {
        currentRoll: whitePlayer.dice?.currentRoll || undefined,
        availableMoves: getAvailableDiceValues(game, 'white'),
        usedMoves: getUsedDiceValues(game, 'white'),
        stateKind: getDiceStateKind(game, 'white')
      }
    }

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create dice state snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Create cube state snapshot with proper error handling
 */
function createCubeStateSnapshot(game: BackgammonGame): SnapshotResult<CubeStateSnapshot> {
  try {
    const cubeStateKind = game.cube.stateKind === 'initialized' ? 'centered' : 
                          game.cube.stateKind === 'maxxed' ? 'maxed' :
                          game.cube.stateKind as 'centered' | 'offered' | 'doubled' | 'maxed'

    const cubeOwner = game.cube.owner as unknown as BackgammonColor | undefined

    const snapshot: CubeStateSnapshot = {
      value: game.cube.value ?? 1,
      owner: cubeOwner,
      stateKind: cubeStateKind,
      position: cubeOwner || 'center'
    }

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create cube state snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Create player states snapshot with exhaustive pattern matching
 */
function createPlayerStatesSnapshot(game: BackgammonGame): SnapshotResult<PlayerStatesSnapshot> {
  try {
    const blackPlayer = getPlayerByColor(game, 'black')
    const whitePlayer = getPlayerByColor(game, 'white')

    if (!blackPlayer || !whitePlayer) {
      return {
        kind: 'failure',
        error: 'Could not find both players in game'
      }
    }

    const snapshot: PlayerStatesSnapshot = {
      black: {
        pipCount: calculatePipCount(game, 'black'),
        stateKind: blackPlayer.stateKind,
        isRobot: blackPlayer.isRobot || false,
        userId: blackPlayer.userId || '',
        timeRemaining: undefined, // timeRemaining not available in BackgammonPlayer type
        movesThisTurn: getMovesThisTurn(game, 'black'),
        totalMoves: getTotalMoves(game, 'black'),
        canBearOff: canBearOff(game, 'black'),
        hasCheckersOnBar: hasCheckersOnBar(game, blackPlayer)
      },
      white: {
        pipCount: calculatePipCount(game, 'white'),
        stateKind: whitePlayer.stateKind,
        isRobot: whitePlayer.isRobot || false,
        userId: whitePlayer.userId || '',
        timeRemaining: undefined, // timeRemaining not available in BackgammonPlayer type
        movesThisTurn: getMovesThisTurn(game, 'white'),
        totalMoves: getTotalMoves(game, 'white'),
        canBearOff: canBearOff(game, 'white'),
        hasCheckersOnBar: hasCheckersOnBar(game, whitePlayer)
      }
    }

    return { kind: 'success', data: snapshot }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Failed to create player states snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// === RESTORATION FUNCTIONS ===

/**
 * Restore board from snapshot (placeholder - requires full Board class integration)
 */
async function restoreBoardFromSnapshot(boardSnapshot: BoardPositionSnapshot): Promise<SnapshotResult<any>> {
  try {
    logger.debug('Restoring board from snapshot')
    
    // Placeholder - actual implementation would:
    // 1. Create a new Board instance
    // 2. Populate points with checkers from snapshot.points
    // 3. Set bar checkers from snapshot.bar using player.direction
    // 4. Set off checkers from snapshot.off using player.direction
    
    return {
      kind: 'failure',
      error: 'Board restoration not yet implemented - requires Board class integration'
    }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Board restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Restore players from snapshot (placeholder - requires full Player class integration)
 */
async function restorePlayersFromSnapshot(
  playerSnapshot: PlayerStatesSnapshot,
  diceSnapshot: DiceStateSnapshot
): Promise<SnapshotResult<any>> {
  try {
    logger.debug('Restoring players from snapshot')
    
    // Placeholder - actual implementation would:
    // 1. Create Player instances for black and white
    // 2. Set dice states from diceSnapshot
    // 3. Set timing and move counts from playerSnapshot
    // 4. Ensure proper player.direction mapping
    
    return {
      kind: 'failure',
      error: 'Players restoration not yet implemented - requires Player class integration'
    }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Players restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

/**
 * Restore cube from snapshot (placeholder - requires full Cube class integration)
 */
function restoreCubeFromSnapshot(cubeSnapshot: CubeStateSnapshot): SnapshotResult<any> {
  try {
    logger.debug('Restoring cube from snapshot')
    
    // Placeholder - actual implementation would:
    // 1. Create a new Cube instance
    // 2. Set value, owner, and state from snapshot
    
    return {
      kind: 'failure',
      error: 'Cube restoration not yet implemented - requires Cube class integration'
    }
  } catch (error) {
    return {
      kind: 'failure',
      error: `Cube restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      details: error
    }
  }
}

// === VALIDATION FUNCTIONS ===

/**
 * Validate board positions with proper checker counting
 */
function validateBoardPositions(boardSnapshot: BoardPositionSnapshot): ValidationResult {
  try {
    // Check that total checkers equals expected (15 per player)
    let blackCheckers = 0
    let whiteCheckers = 0

    // Count checkers on points
    Object.values(boardSnapshot.points).forEach(checkers => {
      checkers.forEach(checker => {
        if (checker.color === 'black') blackCheckers++
        else if (checker.color === 'white') whiteCheckers++
      })
    })

    // Count checkers on bar
    blackCheckers += boardSnapshot.bar.black.length
    whiteCheckers += boardSnapshot.bar.white.length

    // Count checkers off
    blackCheckers += boardSnapshot.off.black.length
    whiteCheckers += boardSnapshot.off.white.length

    if (blackCheckers !== 15) {
      return {
        kind: 'invalid',
        reason: `Invalid black checker count: expected 15, got ${blackCheckers}`
      }
    }

    if (whiteCheckers !== 15) {
      return {
        kind: 'invalid',
        reason: `Invalid white checker count: expected 15, got ${whiteCheckers}`
      }
    }

    return { kind: 'valid' }
  } catch (error) {
    return {
      kind: 'invalid',
      reason: `Board position validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validate dice state consistency
 */
function validateDiceState(diceSnapshot: DiceStateSnapshot): ValidationResult {
  try {
    // Validate dice values are within range [1,6]
    const validateDiceValues = (diceValues: BackgammonDieValue[]): boolean => {
      return diceValues.every(value => value >= 1 && value <= 6)
    }

    if (!validateDiceValues(diceSnapshot.black.availableMoves)) {
      return {
        kind: 'invalid',
        reason: 'Invalid black available dice values'
      }
    }

    if (!validateDiceValues(diceSnapshot.white.availableMoves)) {
      return {
        kind: 'invalid',
        reason: 'Invalid white available dice values'
      }
    }

    if (!validateDiceValues(diceSnapshot.black.usedMoves)) {
      return {
        kind: 'invalid',
        reason: 'Invalid black used dice values'
      }
    }

    if (!validateDiceValues(diceSnapshot.white.usedMoves)) {
      return {
        kind: 'invalid',
        reason: 'Invalid white used dice values'
      }
    }

    return { kind: 'valid' }
  } catch (error) {
    return {
      kind: 'invalid',
      reason: `Dice state validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validate cube state
 */
function validateCubeState(cubeSnapshot: CubeStateSnapshot): ValidationResult {
  if (cubeSnapshot.value < 1 || cubeSnapshot.value > 64) {
    return {
      kind: 'invalid',
      reason: `Invalid cube value: ${cubeSnapshot.value} (must be 1-64)`
    }
  }

  if (cubeSnapshot.value & (cubeSnapshot.value - 1)) {
    return {
      kind: 'invalid',
      reason: `Cube value must be power of 2: ${cubeSnapshot.value}`
    }
  }

  return { kind: 'valid' }
}

/**
 * Validate player states
 */
function validatePlayerStates(playerSnapshot: PlayerStatesSnapshot): ValidationResult {
  try {
    // Validate pip counts are non-negative
    if (playerSnapshot.black.pipCount < 0) {
      return {
        kind: 'invalid',
        reason: `Invalid black pip count: ${playerSnapshot.black.pipCount}`
      }
    }

    if (playerSnapshot.white.pipCount < 0) {
      return {
        kind: 'invalid',
        reason: `Invalid white pip count: ${playerSnapshot.white.pipCount}`
      }
    }

    // Validate move counts are non-negative
    if (playerSnapshot.black.movesThisTurn < 0 || playerSnapshot.black.totalMoves < 0) {
      return {
        kind: 'invalid',
        reason: 'Invalid black move counts'
      }
    }

    if (playerSnapshot.white.movesThisTurn < 0 || playerSnapshot.white.totalMoves < 0) {
      return {
        kind: 'invalid',
        reason: 'Invalid white move counts'
      }
    }

    return { kind: 'valid' }
  } catch (error) {
    return {
      kind: 'invalid',
      reason: `Player states validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

/**
 * Validate pip count consistency with board positions
 */
function validatePipCounts(snapshot: GameStateSnapshot): ValidationResult {
  try {
    // Calculate pip counts from board positions
    let calculatedBlackPips = 0
    let calculatedWhitePips = 0

    // Count pips from points
    Object.entries(snapshot.boardPositions.points).forEach(([position, checkers]) => {
      const pointValue = parseInt(position)
      checkers.forEach(checker => {
        if (checker.color === 'black') {
          // Black moves counterclockwise, so pip count is 25 - position
          calculatedBlackPips += (25 - pointValue)
        } else if (checker.color === 'white') {
          // White moves clockwise, so pip count is position
          calculatedWhitePips += pointValue
        }
      })
    })

    // Add 25 pips for each checker on bar
    calculatedBlackPips += snapshot.boardPositions.bar.black.length * 25
    calculatedWhitePips += snapshot.boardPositions.bar.white.length * 25

    // Checkers that are off don't contribute to pip count

    if (calculatedBlackPips !== snapshot.pipCounts.black) {
      return {
        kind: 'invalid',
        reason: `Black pip count mismatch: calculated ${calculatedBlackPips}, stored ${snapshot.pipCounts.black}`
      }
    }

    if (calculatedWhitePips !== snapshot.pipCounts.white) {
      return {
        kind: 'invalid',
        reason: `White pip count mismatch: calculated ${calculatedWhitePips}, stored ${snapshot.pipCounts.white}`
      }
    }

    return { kind: 'valid' }
  } catch (error) {
    return {
      kind: 'invalid',
      reason: `Pip count validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// === COMPARISON FUNCTIONS ===

/**
 * Compare cube states
 */
function compareCubeStates(cube1: CubeStateSnapshot, cube2: CubeStateSnapshot): ComparisonResult {
  const differences: string[] = []

  if (cube1.value !== cube2.value) {
    differences.push(`value: ${cube1.value} vs ${cube2.value}`)
  }
  if (cube1.owner !== cube2.owner) {
    differences.push(`owner: ${cube1.owner} vs ${cube2.owner}`)
  }
  if (cube1.stateKind !== cube2.stateKind) {
    differences.push(`stateKind: ${cube1.stateKind} vs ${cube2.stateKind}`)
  }
  if (cube1.position !== cube2.position) {
    differences.push(`position: ${cube1.position} vs ${cube2.position}`)
  }

  return differences.length === 0 ? 
    { kind: 'equal' } : 
    { kind: 'different', differences }
}

/**
 * Compare board positions with detailed checker tracking
 */
function compareBoardPositions(board1: BoardPositionSnapshot, board2: BoardPositionSnapshot): ComparisonResult {
  const differences: string[] = []

  // Compare points
  const allPositions = new Set([
    ...Object.keys(board1.points),
    ...Object.keys(board2.points)
  ])

  allPositions.forEach(position => {
    const checkers1 = board1.points[position] || []
    const checkers2 = board2.points[position] || []
    
    if (checkers1.length !== checkers2.length) {
      differences.push(`point ${position}: ${checkers1.length} vs ${checkers2.length} checkers`)
    } else {
      // Compare checker colors at this position
      const colors1 = checkers1.map(c => c.color).sort()
      const colors2 = checkers2.map(c => c.color).sort()
      if (JSON.stringify(colors1) !== JSON.stringify(colors2)) {
        differences.push(`point ${position}: checker colors differ`)
      }
    }
  })

  // Compare bar
  if (board1.bar.black.length !== board2.bar.black.length) {
    differences.push(`bar.black: ${board1.bar.black.length} vs ${board2.bar.black.length} checkers`)
  }
  if (board1.bar.white.length !== board2.bar.white.length) {
    differences.push(`bar.white: ${board1.bar.white.length} vs ${board2.bar.white.length} checkers`)
  }

  // Compare off
  if (board1.off.black.length !== board2.off.black.length) {
    differences.push(`off.black: ${board1.off.black.length} vs ${board2.off.black.length} checkers`)
  }
  if (board1.off.white.length !== board2.off.white.length) {
    differences.push(`off.white: ${board1.off.white.length} vs ${board2.off.white.length} checkers`)
  }

  return differences.length === 0 ? 
    { kind: 'equal' } : 
    { kind: 'different', differences }
}

/**
 * Compare dice states
 */
function compareDiceStates(dice1: DiceStateSnapshot, dice2: DiceStateSnapshot): ComparisonResult {
  const differences: string[] = []

  // Compare black dice
  if (JSON.stringify(dice1.black.currentRoll) !== JSON.stringify(dice2.black.currentRoll)) {
    differences.push(`black.currentRoll: ${JSON.stringify(dice1.black.currentRoll)} vs ${JSON.stringify(dice2.black.currentRoll)}`)
  }
  if (JSON.stringify(dice1.black.availableMoves) !== JSON.stringify(dice2.black.availableMoves)) {
    differences.push(`black.availableMoves: ${JSON.stringify(dice1.black.availableMoves)} vs ${JSON.stringify(dice2.black.availableMoves)}`)
  }
  if (JSON.stringify(dice1.black.usedMoves) !== JSON.stringify(dice2.black.usedMoves)) {
    differences.push(`black.usedMoves: ${JSON.stringify(dice1.black.usedMoves)} vs ${JSON.stringify(dice2.black.usedMoves)}`)
  }
  if (dice1.black.stateKind !== dice2.black.stateKind) {
    differences.push(`black.stateKind: ${dice1.black.stateKind} vs ${dice2.black.stateKind}`)
  }

  // Compare white dice
  if (JSON.stringify(dice1.white.currentRoll) !== JSON.stringify(dice2.white.currentRoll)) {
    differences.push(`white.currentRoll: ${JSON.stringify(dice1.white.currentRoll)} vs ${JSON.stringify(dice2.white.currentRoll)}`)
  }
  if (JSON.stringify(dice1.white.availableMoves) !== JSON.stringify(dice2.white.availableMoves)) {
    differences.push(`white.availableMoves: ${JSON.stringify(dice1.white.availableMoves)} vs ${JSON.stringify(dice2.white.availableMoves)}`)
  }
  if (JSON.stringify(dice1.white.usedMoves) !== JSON.stringify(dice2.white.usedMoves)) {
    differences.push(`white.usedMoves: ${JSON.stringify(dice1.white.usedMoves)} vs ${JSON.stringify(dice2.white.usedMoves)}`)
  }
  if (dice1.white.stateKind !== dice2.white.stateKind) {
    differences.push(`white.stateKind: ${dice1.white.stateKind} vs ${dice2.white.stateKind}`)
  }

  return differences.length === 0 ? 
    { kind: 'equal' } : 
    { kind: 'different', differences }
}

/**
 * Compare player states
 */
function comparePlayerStates(players1: PlayerStatesSnapshot, players2: PlayerStatesSnapshot): ComparisonResult {
  const differences: string[] = []

  // Compare black player
  if (players1.black.pipCount !== players2.black.pipCount) {
    differences.push(`black.pipCount: ${players1.black.pipCount} vs ${players2.black.pipCount}`)
  }
  if (players1.black.stateKind !== players2.black.stateKind) {
    differences.push(`black.stateKind: ${players1.black.stateKind} vs ${players2.black.stateKind}`)
  }
  if (players1.black.isRobot !== players2.black.isRobot) {
    differences.push(`black.isRobot: ${players1.black.isRobot} vs ${players2.black.isRobot}`)
  }
  if (players1.black.movesThisTurn !== players2.black.movesThisTurn) {
    differences.push(`black.movesThisTurn: ${players1.black.movesThisTurn} vs ${players2.black.movesThisTurn}`)
  }
  if (players1.black.canBearOff !== players2.black.canBearOff) {
    differences.push(`black.canBearOff: ${players1.black.canBearOff} vs ${players2.black.canBearOff}`)
  }
  if (players1.black.hasCheckersOnBar !== players2.black.hasCheckersOnBar) {
    differences.push(`black.hasCheckersOnBar: ${players1.black.hasCheckersOnBar} vs ${players2.black.hasCheckersOnBar}`)
  }

  // Compare white player
  if (players1.white.pipCount !== players2.white.pipCount) {
    differences.push(`white.pipCount: ${players1.white.pipCount} vs ${players2.white.pipCount}`)
  }
  if (players1.white.stateKind !== players2.white.stateKind) {
    differences.push(`white.stateKind: ${players1.white.stateKind} vs ${players2.white.stateKind}`)
  }
  if (players1.white.isRobot !== players2.white.isRobot) {
    differences.push(`white.isRobot: ${players1.white.isRobot} vs ${players2.white.isRobot}`)
  }
  if (players1.white.movesThisTurn !== players2.white.movesThisTurn) {
    differences.push(`white.movesThisTurn: ${players1.white.movesThisTurn} vs ${players2.white.movesThisTurn}`)
  }
  if (players1.white.canBearOff !== players2.white.canBearOff) {
    differences.push(`white.canBearOff: ${players1.white.canBearOff} vs ${players2.white.canBearOff}`)
  }
  if (players1.white.hasCheckersOnBar !== players2.white.hasCheckersOnBar) {
    differences.push(`white.hasCheckersOnBar: ${players1.white.hasCheckersOnBar} vs ${players2.white.hasCheckersOnBar}`)
  }

  return differences.length === 0 ? 
    { kind: 'equal' } : 
    { kind: 'different', differences }
}

// === UTILITY FUNCTIONS ===

/**
 * Get player by color - pure helper function
 * FOLLOWS CLAUDE.md: Uses game.players.find(player => player.color === color)
 */
function getPlayerByColor(game: BackgammonGame, color: BackgammonColor): BackgammonPlayer | null {
  return game.players.find(player => player.color === color) || null
}

/**
 * Check if player has checkers on bar using correct board access pattern
 * FOLLOWS CLAUDE.md: Uses player.direction instead of color
 */
function hasCheckersOnBar(game: BackgammonGame, player: BackgammonPlayer): boolean {
  return game.board.bar[player.direction].checkers.length > 0
}

// === PLACEHOLDER HELPER FUNCTIONS ===
// These would be implemented with actual game logic or imported from other modules

function calculateTurnNumber(game: BackgammonGame): number {
  // Implementation would track turn numbers
  return 1
}

function calculateMoveNumber(game: BackgammonGame): number {
  // Implementation would track move numbers within turns
  return 1
}

function calculatePipCount(game: BackgammonGame, color: BackgammonColor): number {
  // Implementation would calculate pip count for a player
  let pipCount = 0
  
  const player = getPlayerByColor(game, color)
  if (!player) return 0

  // Count pips for checkers on points
  game.board.points.forEach(point => {
    const playerCheckers = point.checkers.filter(checker => checker.color === color)
    const pointValue = player.direction === 'clockwise' ? 
      point.position.clockwise : 
      25 - point.position.counterclockwise
    pipCount += playerCheckers.length * pointValue
  })

  // Add 25 pips for each checker on bar
  pipCount += game.board.bar[player.direction].checkers.length * 25

  return pipCount
}

function getAvailableDiceValues(game: BackgammonGame, color: BackgammonColor): BackgammonDieValue[] {
  // Implementation would return available dice values for moves
  return []
}

function getUsedDiceValues(game: BackgammonGame, color: BackgammonColor): BackgammonDieValue[] {
  // Implementation would return used dice values
  return []
}

function getDiceStateKind(game: BackgammonGame, color: BackgammonColor): 'inactive' | 'rolling' | 'rolled' | 'moving' | 'completed' {
  // Implementation would determine dice state based on game state and active player
  if (game.activeColor !== color) return 'inactive'
  
  // Use exhaustive pattern matching on game state
  switch (game.stateKind) {
    case 'rolling-for-start':
      return 'rolling'
    case 'rolled-for-start':
      return 'rolled'
    case 'rolling':
      return 'rolling'
    case 'moving':
      return 'moving'
    case 'doubled':
      return 'inactive'
    case 'completed':
      return 'completed'
    default:
      // For any other states, return inactive
      return 'inactive'
  }
}

function getMovesThisTurn(game: BackgammonGame, color: BackgammonColor): number {
  // Implementation would count moves made this turn
  if (game.activePlay && game.activeColor === color && 'moves' in game.activePlay) {
    return (game.activePlay as any).moves.filter((move: any) => move.stateKind === 'completed').length
  }
  return 0
}

function getTotalMoves(game: BackgammonGame, color: BackgammonColor): number {
  // Implementation would count total moves in game
  // This would require tracking across the entire game history
  return 0
}

function canBearOff(game: BackgammonGame, color: BackgammonColor): boolean {
  // Implementation would check if all checkers are in home board
  const player = getPlayerByColor(game, color)
  if (!player) return false

  // Define home board positions based on player direction
  const isInHomeBoard = (position: number): boolean => {
    if (player.direction === 'clockwise') {
      return position <= 6  // Positions 1-6 for clockwise
    } else {
      return position <= 6  // Positions 1-6 for counterclockwise (using their perspective)
    }
  }

  // Check if player has any checkers outside home board
  const hasCheckersOutside = game.board.points.some(point => {
    const pointPosition = point.position[player.direction]
    return !isInHomeBoard(pointPosition) && 
           point.checkers.some(checker => checker.color === color)
  })

  // Check if player has checkers on bar
  const hasCheckersOnBarResult = hasCheckersOnBar(game, player)

  return !hasCheckersOutside && !hasCheckersOnBarResult
}

function generateGnuPositionId(game: BackgammonGame): string | undefined {
  // Implementation would generate GNU Backgammon position ID
  // This would use the existing gnuPositionId functionality from the Board module
  return undefined
}
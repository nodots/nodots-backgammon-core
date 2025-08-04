import {
  failure,
  GameHistoryAction,
  GameStateSnapshot,
  ReconstructionOptions,
  ReconstructionResult,
  Result,
  success,
} from '@nodots-llc/backgammon-types/dist'
import { SnapshotService } from './SnapshotService'

// Pure function to reconstruct game state at a specific sequence number
export const reconstructAtSequence = async (
  gameActions: readonly GameHistoryAction[],
  options: ReconstructionOptions
): Promise<Result<ReconstructionResult, string>> => {
  try {
    const { targetSequenceNumber, validateIntegrity = true } = options
    const errors: string[] = []
    const warnings: string[] = []

    // Validate input - early return
    if (gameActions.length === 0) {
      return failure('No game actions provided')
    }

    // Sort actions by sequence number to ensure correct order
    const sortedActions = sortActionsBySequence(gameActions)

    // Validate sequence number continuity
    const sequenceGaps = validateSequenceNumberContinuity(sortedActions)
    if (sequenceGaps.length > 0) {
      warnings.push(`Sequence number gaps detected: ${sequenceGaps.join(', ')}`)
    }

    // Find the target action
    const targetActionResult = findTargetAction(
      sortedActions,
      targetSequenceNumber
    )

    // Use exhaustive conditional logic instead of match
    if (!targetActionResult.found) {
      // Try to find closest earlier action
      const closestActionResult = findClosestEarlierAction(
        sortedActions,
        targetSequenceNumber
      )

      if (!closestActionResult.found) {
        return success({
          success: false,
          gameSnapshot: {} as GameStateSnapshot,
          reconstructedAt: new Date(),
          sequenceNumber: targetSequenceNumber,
          errors: [
            `No action found at or before sequence number ${targetSequenceNumber}`,
          ],
        })
      }

      warnings.push(
        `Exact sequence ${targetSequenceNumber} not found, using closest earlier action ${closestActionResult.action!.sequenceNumber}`
      )

      const snapshot = closestActionResult.action!.gameStateAfter
      const integrityErrors = validateIntegrity
        ? validateSnapshotIntegrity(snapshot, closestActionResult.action!)
        : []

      return success({
        success: integrityErrors.length === 0,
        gameSnapshot: snapshot,
        reconstructedAt: new Date(),
        sequenceNumber: closestActionResult.action!.sequenceNumber,
        errors: integrityErrors.length > 0 ? integrityErrors : undefined,
        warnings: warnings.length > 0 ? warnings : undefined,
      })
    }

    // Found exact target action
    const snapshot = targetActionResult.action!.gameStateAfter
    const integrityErrors = validateIntegrity
      ? validateSnapshotIntegrity(snapshot, targetActionResult.action!)
      : []

    const contextErrors = validateIntegrity
      ? validateReconstructionContext(targetActionResult.action!, snapshot)
      : []

    const allErrors = [...integrityErrors, ...contextErrors]

    return success({
      success: allErrors.length === 0,
      gameSnapshot: snapshot,
      reconstructedAt: new Date(),
      sequenceNumber: targetSequenceNumber,
      errors: allErrors.length > 0 ? allErrors : undefined,
      warnings: warnings.length > 0 ? warnings : undefined,
    })
  } catch (error) {
    return failure(
      `Failed to reconstruct at sequence: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure function to reconstruct the entire sequence of game states
export const reconstructFullSequence = async (
  gameActions: readonly GameHistoryAction[]
): Promise<Result<readonly GameStateSnapshot[], string>> => {
  try {
    // Early return for empty actions
    if (gameActions.length === 0) {
      return success([])
    }

    const sortedActions = sortActionsBySequence(gameActions)
    const snapshots: GameStateSnapshot[] = []

    // Start with the "before" state of the first action
    if (sortedActions[0]) {
      snapshots.push(sortedActions[0].gameStateBefore)
    }

    // Add the "after" state of each action
    for (const action of sortedActions) {
      snapshots.push(action.gameStateAfter)
    }

    return success(snapshots)
  } catch (error) {
    return failure(
      `Failed to reconstruct full sequence: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

// Pure function to find optimal reconstruction path
export const findOptimalReconstructionPath = (
  gameActions: readonly GameHistoryAction[],
  targetSequenceNumber: number
): {
  startFromSequence: number
  actionsToReplay: number
  estimatedCost: number
} => {
  const sortedActions = sortActionsBySequence(gameActions)

  // Simple strategy: always use the exact snapshot if available
  const targetAction = sortedActions.find(
    (action) => action.sequenceNumber === targetSequenceNumber
  )

  // Use traditional conditional logic instead of match
  if (targetAction) {
    return {
      startFromSequence: targetSequenceNumber,
      actionsToReplay: 0,
      estimatedCost: 1, // Direct snapshot lookup
    }
  }

  // Find closest earlier action
  const closestAction = sortedActions
    .filter((action) => action.sequenceNumber <= targetSequenceNumber)
    .pop()

  if (!closestAction) {
    return {
      startFromSequence: 0,
      actionsToReplay: targetSequenceNumber,
      estimatedCost: targetSequenceNumber * 10, // High cost for full replay
    }
  }

  return {
    startFromSequence: closestAction.sequenceNumber,
    actionsToReplay: targetSequenceNumber - closestAction.sequenceNumber,
    estimatedCost: (targetSequenceNumber - closestAction.sequenceNumber) * 5,
  }
}

// Pure helper functions

const sortActionsBySequence = (
  actions: readonly GameHistoryAction[]
): readonly GameHistoryAction[] =>
  [...actions].sort((a, b) => a.sequenceNumber - b.sequenceNumber)

const validateSequenceNumberContinuity = (
  sortedActions: readonly GameHistoryAction[]
): number[] => {
  const gaps: number[] = []

  for (let i = 1; i < sortedActions.length; i++) {
    const expectedSequence = sortedActions[i - 1].sequenceNumber + 1
    const actualSequence = sortedActions[i].sequenceNumber

    if (actualSequence !== expectedSequence) {
      // Record the missing sequence numbers
      for (
        let missing = expectedSequence;
        missing < actualSequence;
        missing++
      ) {
        gaps.push(missing)
      }
    }
  }

  return gaps
}

const findTargetAction = (
  sortedActions: readonly GameHistoryAction[],
  targetSequenceNumber: number
): { found: boolean; action?: GameHistoryAction } => {
  const targetAction = sortedActions.find(
    (action) => action.sequenceNumber === targetSequenceNumber
  )
  return targetAction ? { found: true, action: targetAction } : { found: false }
}

const findClosestEarlierAction = (
  sortedActions: readonly GameHistoryAction[],
  targetSequenceNumber: number
): { found: boolean; action?: GameHistoryAction } => {
  const closestAction = sortedActions
    .filter((action) => action.sequenceNumber <= targetSequenceNumber)
    .pop()

  return closestAction
    ? { found: true, action: closestAction }
    : { found: false }
}

const validateSnapshotIntegrity = (
  snapshot: GameStateSnapshot,
  action: GameHistoryAction
): string[] => {
  const errors: string[] = []

  // Use the SnapshotService to validate basic structure
  const basicValidation = SnapshotService.validateSnapshot(snapshot)
  if (!basicValidation.success) {
    errors.push('Snapshot failed basic validation')
  }

  // Validate checker counts
  const checkerCounts = countCheckersInSnapshot(snapshot)

  // Validate checker counts using traditional conditionals
  if (checkerCounts.black !== 15) {
    errors.push(`Black player has ${checkerCounts.black} checkers, expected 15`)
  }

  if (checkerCounts.white !== 15) {
    errors.push(`White player has ${checkerCounts.white} checkers, expected 15`)
  }

  // Validate dice state consistency
  const colors: ('black' | 'white')[] = ['black', 'white']
  for (const color of colors) {
    const playerDice = snapshot.diceState[color]

    // Validate rolled state consistency using exhaustive conditionals
    if (playerDice.stateKind === 'rolled') {
      if (!playerDice.currentRoll) {
        errors.push(
          `${color} player dice state is 'rolled' but no currentRoll present`
        )
      }
    } else {
      if (playerDice.currentRoll) {
        errors.push(
          `${color} player dice state is '${playerDice.stateKind}' but currentRoll is present`
        )
      }
    }
  }

  return errors
}

const validateReconstructionContext = (
  action: GameHistoryAction,
  snapshot: GameStateSnapshot
): string[] => {
  const errors: string[] = []

  // Validate that the snapshot state is consistent with the action type using exhaustive switch
  switch (action.actionType) {
    case 'roll-dice':
      if (snapshot.stateKind !== 'rolled') {
        errors.push(
          `After roll-dice action, expected state 'rolled' but got '${snapshot.stateKind}'`
        )
      }
      break
    case 'make-move':
      if (snapshot.stateKind !== 'moving' && snapshot.stateKind !== 'moved') {
        errors.push(
          `After make-move action, expected state 'moving' or 'moved' but got '${snapshot.stateKind}'`
        )
      }
      break
    case 'offer-double':
      if (snapshot.stateKind !== 'doubled') {
        errors.push(
          `After offer-double action, expected state 'doubled' but got '${snapshot.stateKind}'`
        )
      }
      break
    case 'game-end':
      if (snapshot.stateKind !== 'completed') {
        errors.push(
          `After game-end action, expected state 'completed' but got '${snapshot.stateKind}'`
        )
      }
      break
    default:
      // No specific validation for other action types
      break
  }

  return errors
}

const countCheckersInSnapshot = (
  snapshot: GameStateSnapshot
): { black: number; white: number } => {
  const counts = { black: 0, white: 0 }

  // Count checkers in all positions
  for (const [, checkers] of Object.entries(snapshot.boardPositions)) {
    for (const checker of checkers) {
      counts[checker.color]++
    }
  }

  return counts
}

// Export the functional service module
export const ReconstructionService = {
  reconstructAtSequence,
  reconstructFullSequence,
  findOptimalReconstructionPath,
} as const

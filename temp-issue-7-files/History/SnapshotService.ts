import {
  BackgammonColor,
  BackgammonGame,
  CheckerSnapshot,
  GameStateSnapshot,
  Result,
  ValidationResult,
  combineValidations,
  failure,
  safeExecute,
  success,
} from '@nodots-llc/backgammon-types/dist'

// Pure function to create a complete snapshot of game state
export const createSnapshot = (
  game: BackgammonGame
): Result<GameStateSnapshot, string> => {
  return safeExecute(() => ({
    stateKind: game.stateKind,
    activeColor: game.activeColor || 'white',
    boardPositions: captureBoardPositions(game),
    diceState: captureDiceState(game),
    cubeState: captureCubeState(game),
    playerStates: capturePlayerStates(game),
    gnuPositionId: game.gnuPositionId,
    moveCount: calculateMoveCount(game),
    turnCount: calculateTurnCount(game),
  }))
}

// Pure function to capture board positions
const captureBoardPositions = (
  game: BackgammonGame
): { [position: string]: CheckerSnapshot[] } => {
  const result = safeExecute(() => {
    const positions: { [position: string]: CheckerSnapshot[] } = {}
    // Capture points (1-24)
    for (const point of game.board.points) {
      const clockwisePos = `${point.position.clockwise}`

      if (point.checkers.length > 0) {
        positions[clockwisePos] = point.checkers.map((checker) => ({
          id: checker.id,
          color: checker.color,
        }))
      }
    }

    // Capture bar positions using switch for position detection
    const barPositions = [
      { key: 'bar-clockwise', container: game.board.bar.clockwise },
      {
        key: 'bar-counterclockwise',
        container: game.board.bar.counterclockwise,
      },
    ] as const

    for (const { key, container } of barPositions) {
      if (container.checkers.length > 0) {
        positions[key] = container.checkers.map((checker) => ({
          id: checker.id,
          color: checker.color,
        }))
      }
    }

    // Capture off positions using switch for position detection
    const offPositions = [
      { key: 'off-clockwise', container: game.board.off.clockwise },
      {
        key: 'off-counterclockwise',
        container: game.board.off.counterclockwise,
      },
    ] as const

    for (const { key, container } of offPositions) {
      if (container.checkers.length > 0) {
        positions[key] = container.checkers.map((checker) => ({
          id: checker.id,
          color: checker.color,
        }))
      }
    }

    return positions
  })

  return result.success ? result.data : {}
}

// Pure function to capture dice state
const captureDiceState = (
  game: BackgammonGame
): GameStateSnapshot['diceState'] => {
  const initialDiceState: GameStateSnapshot['diceState'] = {
    black: { stateKind: 'inactive' },
    white: { stateKind: 'inactive' },
  }

  return game.players.reduce((diceState, player) => {
    const color = player.color as BackgammonColor

    return {
      ...diceState,
      [color]: {
        currentRoll:
          player.dice.stateKind === 'rolled'
            ? player.dice.currentRoll
            : undefined,
        stateKind: player.dice.stateKind,
        usedDice: getUsedDice(game, color),
      },
    }
  }, initialDiceState)
}

// Pure function to capture cube state
const captureCubeState = (
  game: BackgammonGame
): GameStateSnapshot['cubeState'] => {
  const result = safeExecute(() => ({
    value: game.cube.value,
    owner: game.cube.owner,
    stateKind: game.cube.stateKind,
  }))

  return result.success
    ? {
        value: result.data.value || 1,
        owner: result.data.owner?.color,
        stateKind:
          result.data.stateKind === 'initialized'
            ? 'centered'
            : result.data.stateKind,
      }
    : {
        value: 1,
        stateKind: 'centered' as const,
      }
}

// Pure function to capture player states
const capturePlayerStates = (
  game: BackgammonGame
): GameStateSnapshot['playerStates'] => {
  const initialPlayerStates: GameStateSnapshot['playerStates'] = {
    black: {
      pipCount: 0,
      stateKind: 'inactive',
      isRobot: false,
      userId: '',
      direction: 'clockwise',
    },
    white: {
      pipCount: 0,
      stateKind: 'inactive',
      isRobot: false,
      userId: '',
      direction: 'clockwise',
    },
  }

  return game.players.reduce((playerStates, player) => {
    const color = player.color as BackgammonColor

    return {
      ...playerStates,
      [color]: {
        pipCount:
          typeof player.pipCount === 'number'
            ? player.pipCount
            : (player.pipCount as any).count,
        stateKind: player.stateKind,
        isRobot: player.isRobot,
        userId: player.userId,
        direction: player.direction,
      },
    }
  }, initialPlayerStates)
}

// Pure function to get used dice
const getUsedDice = (
  game: BackgammonGame,
  color: BackgammonColor
): number[] => {
  const result = safeExecute(() => {
    // Check if there's an active play for this color using traditional conditional
    if (!(game.activePlay && game.activeColor === color)) {
      return []
    }

    const usedDice: number[] = []

    if ('moves' in game.activePlay!) {
      for (const move of game.activePlay?.moves || []) {
        // Use exhaustive conditional instead of match
        const isUsedMove =
          move.stateKind === 'completed' || move.stateKind === 'confirmed'

        if (isUsedMove) {
          usedDice.push(move.dieValue)
        }
      }
    }

    return usedDice
  })

  return result.success ? result.data : []
}

// Pure function to calculate move count
const calculateMoveCount = (game: BackgammonGame): number => {
  const result = safeExecute(() => {
    let moveCount = 0

    if (game.activePlay && 'moves' in game.activePlay) {
      for (const move of game.activePlay?.moves || []) {
        // Use exhaustive conditional instead of match
        const isCounted =
          move.stateKind === 'completed' || move.stateKind === 'confirmed'

        if (isCounted) {
          moveCount++
        }
      }
    }

    return moveCount
  })

  return result.success ? result.data : 0
}

// Pure function to calculate turn count
const calculateTurnCount = (game: BackgammonGame): number => {
  const result = safeExecute(() => {
    // Use traditional conditional instead of match
    if (game.stateKind === 'rolling-for-start') {
      return 0
    }
    return 1 // Simplified - in full implementation would track through history
  })

  return result.success ? result.data : 0
}

// Pure function to validate snapshot
export const validateSnapshot = (
  snapshot: GameStateSnapshot
): ValidationResult => {
  const validations: ValidationResult[] = [
    validateRequiredFields(snapshot),
    validateBoardPositions(snapshot),
    validateDiceState(snapshot),
    validateCubeState(snapshot),
    validatePlayerStates(snapshot),
    validateCheckerCounts(snapshot),
  ]

  return combineValidations(validations)
}

// Pure validation functions using switch statements
const validateRequiredFields = (
  snapshot: GameStateSnapshot
): ValidationResult => {
  const missingFields: string[] = []

  if (!snapshot.stateKind) missingFields.push('stateKind is required')
  if (!snapshot.activeColor) missingFields.push('activeColor is required')

  return missingFields.length > 0 ? failure(missingFields) : success(undefined)
}

const validateBoardPositions = (
  snapshot: GameStateSnapshot
): ValidationResult => {
  if (typeof snapshot.boardPositions === 'object') {
    return snapshot.boardPositions
      ? success(undefined)
      : failure(['boardPositions is null'])
  } else {
    return failure(['boardPositions must be an object'])
  }
}

const validateDiceState = (snapshot: GameStateSnapshot): ValidationResult => {
  const validations: ValidationResult[] = []

  let diceStateValidation: ValidationResult
  if (typeof snapshot.diceState === 'object') {
    diceStateValidation = snapshot.diceState
      ? success(undefined)
      : failure(['diceState is null'])
  } else {
    diceStateValidation = failure(['diceState must be an object'])
  }
  validations.push(diceStateValidation)

  // Validate both player dice states exist
  const colors: BackgammonColor[] = ['black', 'white']
  for (const color of colors) {
    const playerDiceValidation = snapshot.diceState?.[color]
      ? success(undefined)
      : failure([`${color} dice state is missing`])
    validations.push(playerDiceValidation)
  }

  return combineValidations(validations)
}

const validateCubeState = (snapshot: GameStateSnapshot): ValidationResult => {
  // Use traditional conditional instead of match
  if (typeof snapshot.cubeState === 'object') {
    return snapshot.cubeState
      ? success(undefined)
      : failure(['cubeState is null'])
  } else {
    return failure(['cubeState must be an object'])
  }
}

const validatePlayerStates = (
  snapshot: GameStateSnapshot
): ValidationResult => {
  const validations: ValidationResult[] = []

  // Use traditional conditional instead of match
  let playerStateValidation: ValidationResult
  if (typeof snapshot.playerStates === 'object') {
    playerStateValidation = snapshot.playerStates
      ? success(undefined)
      : failure(['playerStates is null'])
  } else {
    playerStateValidation = failure(['playerStates must be an object'])
  }
  validations.push(playerStateValidation)

  // Validate both player states exist
  const colors: BackgammonColor[] = ['black', 'white']
  for (const color of colors) {
    const playerValidation = snapshot.playerStates?.[color]
      ? success(undefined)
      : failure([`${color} player state is missing`])
    validations.push(playerValidation)
  }

  return combineValidations(validations)
}

const validateCheckerCounts = (
  snapshot: GameStateSnapshot
): ValidationResult => {
  const checkerCounts = countCheckersInSnapshot(snapshot)
  const validations: ValidationResult[] = []

  // Use traditional conditionals instead of match
  const blackCountValidation =
    checkerCounts.black === 15
      ? success(undefined)
      : failure([
          `Black player has ${checkerCounts.black} checkers, expected 15`,
        ])
  validations.push(blackCountValidation)

  const whiteCountValidation =
    checkerCounts.white === 15
      ? success(undefined)
      : failure([
          `White player has ${checkerCounts.white} checkers, expected 15`,
        ])
  validations.push(whiteCountValidation)

  return combineValidations(validations)
}

// Pure function to count checkers in snapshot
const countCheckersInSnapshot = (
  snapshot: GameStateSnapshot
): { black: number; white: number } => {
  const result = safeExecute(() => {
    const counts = { black: 0, white: 0 }

    // Count checkers in all positions
    for (const [, checkers] of Object.entries(snapshot.boardPositions)) {
      for (const checker of checkers) {
        counts[checker.color]++
      }
    }

    return counts
  })

  return result.success ? result.data : { black: 0, white: 0 }
}

// Pure function to calculate snapshot size
export const calculateSnapshotSize = (snapshot: GameStateSnapshot): number => {
  const result = safeExecute(() => JSON.stringify(snapshot).length)
  return result.success ? result.data : 0
}

// Pure function to compare snapshots
export const compareSnapshots = (
  before: GameStateSnapshot,
  after: GameStateSnapshot
): readonly string[] => {
  const result = safeExecute(() => {
    const differences: string[] = []

    // Compare state kinds
    if (before.stateKind !== after.stateKind) {
      differences.push(`State: ${before.stateKind} → ${after.stateKind}`)
    }

    // Compare active colors
    if (before.activeColor !== after.activeColor) {
      differences.push(
        `Active player: ${before.activeColor} → ${after.activeColor}`
      )
    }

    // Compare board positions
    const boardDiffs = compareBoardPositions(
      before.boardPositions,
      after.boardPositions
    )
    differences.push(...boardDiffs)

    // Compare dice states
    const diceDiffs = compareDiceStates(before.diceState, after.diceState)
    differences.push(...diceDiffs)

    // Compare cube values
    if (before.cubeState.value !== after.cubeState.value) {
      differences.push(
        `Cube value: ${before.cubeState.value} → ${after.cubeState.value}`
      )
    }

    // Compare cube owners
    if (before.cubeState.owner !== after.cubeState.owner) {
      differences.push(
        `Cube owner: ${before.cubeState.owner || 'centered'} → ${after.cubeState.owner || 'centered'}`
      )
    }

    // Compare move counts
    if (before.moveCount !== after.moveCount) {
      differences.push(`Move count: ${before.moveCount} → ${after.moveCount}`)
    }

    // Compare turn counts
    if (before.turnCount !== after.turnCount) {
      differences.push(`Turn count: ${before.turnCount} → ${after.turnCount}`)
    }

    return differences
  })

  return result.success ? result.data : ['Error comparing snapshots']
}

// Pure function to compare board positions
const compareBoardPositions = (
  before: { [position: string]: CheckerSnapshot[] },
  after: { [position: string]: CheckerSnapshot[] }
): readonly string[] => {
  const result = safeExecute(() => {
    const differences: string[] = []

    // Get all unique positions
    const allPositions = new Set([
      ...Object.keys(before),
      ...Object.keys(after),
    ])

    for (const position of allPositions) {
      const beforeCheckers = before[position] || []
      const afterCheckers = after[position] || []

      if (beforeCheckers.length !== afterCheckers.length) {
        differences.push(
          `Position ${position}: ${beforeCheckers.length} → ${afterCheckers.length} checkers`
        )
      } else if (beforeCheckers.length > 0) {
        // Check if checkers changed when same length
        const beforeColors = beforeCheckers.map((c) => c.color).sort()
        const afterColors = afterCheckers.map((c) => c.color).sort()

        if (JSON.stringify(beforeColors) !== JSON.stringify(afterColors)) {
          differences.push(`Position ${position}: checker composition changed`)
        }
      }
    }

    return differences
  })

  return result.success ? result.data : ['Error comparing board positions']
}

// Pure function to compare dice states
const compareDiceStates = (
  before: GameStateSnapshot['diceState'],
  after: GameStateSnapshot['diceState']
): readonly string[] => {
  const result = safeExecute(() => {
    const differences: string[] = []

    const colors: BackgammonColor[] = ['black', 'white']
    for (const color of colors) {
      const beforeDice = before[color]
      const afterDice = after[color]

      if (beforeDice.stateKind !== afterDice.stateKind) {
        differences.push(
          `${color} dice state: ${beforeDice.stateKind} → ${afterDice.stateKind}`
        )
      }

      // Compare current rolls
      const beforeRoll = beforeDice.currentRoll
        ? beforeDice.currentRoll.join(',')
        : 'none'
      const afterRoll = afterDice.currentRoll
        ? afterDice.currentRoll.join(',')
        : 'none'

      if (beforeRoll !== afterRoll) {
        differences.push(`${color} dice roll: ${beforeRoll} → ${afterRoll}`)
      }

      // Compare used dice
      const beforeUsed = (beforeDice.usedDice || []).join(',') || 'none'
      const afterUsed = (afterDice.usedDice || []).join(',') || 'none'

      if (beforeUsed !== afterUsed) {
        differences.push(`${color} used dice: ${beforeUsed} → ${afterUsed}`)
      }
    }

    return differences
  })

  return result.success ? result.data : ['Error comparing dice states']
}

// Export the functional service module
export const SnapshotService = {
  createSnapshot,
  validateSnapshot,
  calculateSnapshotSize,
  compareSnapshots,
} as const

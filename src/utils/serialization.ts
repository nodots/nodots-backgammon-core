import { BackgammonMove } from '@nodots-llc/backgammon-types'

/**
 * Custom JSON serializer that properly handles Set objects
 * Sets are converted to arrays during serialization
 */
export function serializeGameState(gameState: unknown): string {
  return JSON.stringify(gameState, (key, value: unknown) => {
    // Convert Set objects to arrays for proper serialization
    if (value instanceof Set) {
      return Array.from(value) as unknown[]
    }
    return value as unknown
  })
}

/**
 * Custom JSON deserializer that properly reconstructs Set objects
 * Arrays in moves fields are converted back to Sets
 */
export function deserializeGameState(jsonString: string): unknown {
  const gameState = JSON.parse(jsonString) as unknown

  // Recursively find and fix Set objects
  return reconstructSets(gameState)
}

/**
 * Recursively reconstructs Set objects from arrays
 * This handles nested game states and play objects
 */
function reconstructSets(obj: unknown): unknown {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return (obj as unknown[]).map(reconstructSets)
  }

  const result: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (key === 'moves' && Array.isArray(value)) {
      // Convert moves array back to Set
      result[key] = new Set(value as BackgammonMove[])
    } else if (value !== null && typeof value === 'object') {
      // Recursively process nested objects
      result[key] = reconstructSets(value as unknown)
    } else {
      result[key] = value as unknown
    }
  }

  return result
}

/**
 * Utility function to ensure moves are properly converted to Set
 * Use this when loading game data from external sources
 */
export function ensureMovesAreSet(activePlay: unknown): unknown {
  if (!activePlay) {
    return activePlay
  }

  const playWithMoves = activePlay as { moves?: BackgammonMove[] | Set<BackgammonMove> }
  if (playWithMoves.moves && Array.isArray(playWithMoves.moves)) {
    return {
      ...activePlay,
      moves: new Set(playWithMoves.moves),
    }
  }

  return activePlay
}

/**
 * Utility function to ensure moves are properly converted to Array
 * Use this when saving game data to external sources
 */
export function ensureMovesAreArray(activePlay: unknown): unknown {
  if (!activePlay) {
    return activePlay
  }

  const playWithMoves = activePlay as { moves?: BackgammonMove[] | Set<BackgammonMove> }
  if (playWithMoves.moves && playWithMoves.moves instanceof Set) {
    return {
      ...activePlay,
      moves: Array.from(playWithMoves.moves),
    }
  }

  return activePlay
}

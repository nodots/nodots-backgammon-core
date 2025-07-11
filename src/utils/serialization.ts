import { BackgammonMove } from '@nodots-llc/backgammon-types/dist'

/**
 * Custom JSON serializer that properly handles Set objects
 * Sets are converted to arrays during serialization
 */
export function serializeGameState(gameState: any): string {
  return JSON.stringify(gameState, (key, value) => {
    // Convert Set objects to arrays for proper serialization
    if (value instanceof Set) {
      return Array.from(value)
    }
    return value
  })
}

/**
 * Custom JSON deserializer that properly reconstructs Set objects
 * Arrays in moves fields are converted back to Sets
 */
export function deserializeGameState(jsonString: string): any {
  const gameState = JSON.parse(jsonString)

  // Recursively find and fix Set objects
  return reconstructSets(gameState)
}

/**
 * Recursively reconstructs Set objects from arrays
 * This handles nested game states and play objects
 */
function reconstructSets(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj.map(reconstructSets)
  }

  const result: any = {}
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'moves' && Array.isArray(value)) {
      // Convert moves array back to Set
      result[key] = new Set(value as BackgammonMove[])
    } else if (typeof value === 'object' && value !== null) {
      // Recursively process nested objects
      result[key] = reconstructSets(value)
    } else {
      result[key] = value
    }
  }

  return result
}

/**
 * Utility function to ensure moves are properly converted to Set
 * Use this when loading game data from external sources
 */
export function ensureMovesAreSet(activePlay: any): any {
  if (!activePlay) {
    return activePlay
  }

  if (activePlay.moves && Array.isArray(activePlay.moves)) {
    return {
      ...activePlay,
      moves: new Set(activePlay.moves as BackgammonMove[]),
    }
  }

  return activePlay
}

/**
 * Utility function to ensure moves are properly converted to Array
 * Use this when saving game data to external sources
 */
export function ensureMovesAreArray(activePlay: any): any {
  if (!activePlay) {
    return activePlay
  }

  if (activePlay.moves && activePlay.moves instanceof Set) {
    return {
      ...activePlay,
      moves: Array.from(activePlay.moves),
    }
  }

  return activePlay
}

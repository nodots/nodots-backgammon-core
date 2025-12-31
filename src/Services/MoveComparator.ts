import type { MoveHint, MoveStep } from '@nodots-llc/gnubg-hints'

/**
 * MoveComparator - Pure functions for comparing player moves against GNU BG hints.
 *
 * This module handles the complexity of matching player moves to hint sequences,
 * including support for unordered matching when moves are independent (order doesn't
 * affect the final board position).
 */

/**
 * Simplified move representation using only from/to positions.
 * Used by API layer where full MoveStep details aren't available.
 */
export interface SimplifiedMove {
  from: number
  to: number
}

/**
 * Compare two MoveStep objects for equality.
 * Compares all relevant properties: from, to, containers, and moveKind.
 */
export function stepsEqual(a: MoveStep, b: MoveStep): boolean {
  return (
    a.from === b.from &&
    a.to === b.to &&
    a.fromContainer === b.fromContainer &&
    a.toContainer === b.toContainer &&
    a.moveKind === b.moveKind
  )
}

/**
 * Compare two simplified moves for equality (from/to only).
 */
export function simplifiedMovesEqual(a: SimplifiedMove, b: SimplifiedMove): boolean {
  return a.from === b.from && a.to === b.to
}

/**
 * Check if a sequence of MoveSteps can be reordered without affecting the result.
 *
 * Steps are independent if:
 * - None of them hit an opponent's checker
 * - All are point-to-point moves (not bar entry or bearing off)
 * - No source/destination overlaps exist
 * - No move chains exist (where one move's destination is another's source)
 */
export function areStepsIndependent(sequence: MoveStep[]): boolean {
  if (!sequence || sequence.length <= 1) return true

  // Hits create dependencies (opponent checker goes to bar)
  for (const s of sequence) {
    if (s.isHit) return false
    if (s.moveKind !== 'point-to-point') return false
  }

  const sources = new Set<number>()
  const dests = new Set<number>()

  // Check for direct overlaps
  for (const s of sequence) {
    if (sources.has(s.from) || dests.has(s.to)) return false
    sources.add(s.from)
    dests.add(s.to)
  }

  // Check for chains (dest of one = source of another)
  for (const s of sequence) {
    if (sources.has(s.to) || dests.has(s.from)) return false
  }

  return true
}

/**
 * Check if simplified moves can be reordered without affecting the result.
 *
 * Since we don't have hit/moveKind info, this is a conservative check
 * that only verifies no position overlaps or chains exist.
 */
export function areSimplifiedMovesIndependent(moves: SimplifiedMove[]): boolean {
  if (!moves || moves.length <= 1) return true

  const sources = new Set<number>()
  const dests = new Set<number>()

  // Check for direct overlaps
  for (const m of moves) {
    if (sources.has(m.from) || dests.has(m.to)) return false
    sources.add(m.from)
    dests.add(m.to)
  }

  // Check for chains
  for (const m of moves) {
    if (sources.has(m.to) || dests.has(m.from)) return false
  }

  return true
}

/**
 * Find a hint that matches the player's moves, trying ordered match first,
 * then unordered match for independent moves.
 *
 * This is the main entry point for move comparison.
 */
export function findMatchingHint(
  hints: MoveHint[],
  playerMoves: SimplifiedMove[]
): MoveHint | undefined {
  // Try ordered match first (exact sequence)
  const ordered = findMatchingHintOrdered(hints, playerMoves)
  if (ordered) return ordered

  // Try unordered match only if moves are independent
  if (areSimplifiedMovesIndependent(playerMoves)) {
    return findMatchingHintUnordered(hints, playerMoves)
  }

  return undefined
}

/**
 * Find a hint with exact ordered sequence match.
 * Player moves must match hint moves in the same order.
 */
export function findMatchingHintOrdered(
  hints: MoveHint[],
  playerMoves: SimplifiedMove[]
): MoveHint | undefined {
  return hints.find(hint => {
    if (hint.moves.length !== playerMoves.length) return false
    return hint.moves.every((hintMove, idx) => {
      const playerMove = playerMoves[idx]
      return hintMove.from === playerMove.from && hintMove.to === playerMove.to
    })
  })
}

/**
 * Find a hint with unordered (set-based) match.
 * Player moves must contain the same from/to pairs as hint, regardless of order.
 *
 * This handles cases like:
 * - Player: 8/3 6/3
 * - Hint: 6/3 8/3
 * These are equivalent when both checkers move to different destinations
 * without affecting each other.
 */
export function findMatchingHintUnordered(
  hints: MoveHint[],
  playerMoves: SimplifiedMove[]
): MoveHint | undefined {
  const key = (m: SimplifiedMove) => `${m.from}->${m.to}`

  // Build frequency map of player moves
  const need = new Map<string, number>()
  for (const m of playerMoves) {
    const k = key(m)
    need.set(k, (need.get(k) ?? 0) + 1)
  }

  for (const hint of hints) {
    // Only compare same number of moves
    const moves = hint.moves.slice(0, playerMoves.length)
    if (moves.length < playerMoves.length) continue

    // Build frequency map of hint moves
    const have = new Map<string, number>()
    for (const m of moves) {
      const k = key(m)
      have.set(k, (have.get(k) ?? 0) + 1)
    }

    // Compare frequencies
    let ok = true
    for (const [k, cnt] of need) {
      if ((have.get(k) ?? 0) !== cnt) {
        ok = false
        break
      }
    }
    if (ok) return hint
  }

  return undefined
}

/**
 * Find a hint matching a full MoveStep sequence (ordered).
 * Uses full step equality including containers and moveKind.
 */
export function findHintForSequence(
  hints: MoveHint[],
  sequence: MoveStep[]
): MoveHint | undefined {
  if (!sequence || sequence.length === 0) return undefined

  return hints.find(hint => {
    if (!Array.isArray(hint.moves)) return false
    if (hint.moves.length < sequence.length) return false

    for (let i = 0; i < sequence.length; i++) {
      if (!stepsEqual(hint.moves[i], sequence[i])) return false
    }
    return true
  })
}

/**
 * Find a hint matching a full MoveStep sequence (unordered).
 * Uses full step key for comparison.
 */
export function findHintForSequenceUnordered(
  hints: MoveHint[],
  sequence: MoveStep[]
): MoveHint | undefined {
  if (!sequence || sequence.length === 0) return undefined

  const key = (s: MoveStep) => `${s.moveKind}:${s.fromContainer}:${s.from}->${s.toContainer}:${s.to}`

  const need = new Map<string, number>()
  for (const s of sequence) {
    const k = key(s)
    need.set(k, (need.get(k) ?? 0) + 1)
  }

  for (const hint of hints) {
    const moves = Array.isArray(hint.moves) ? hint.moves.slice(0, sequence.length) : []
    if (moves.length < sequence.length) continue

    const have = new Map<string, number>()
    for (const s of moves) {
      const k = key(s)
      have.set(k, (have.get(k) ?? 0) + 1)
    }

    let ok = true
    for (const [k, cnt] of need) {
      if ((have.get(k) ?? 0) !== cnt) {
        ok = false
        break
      }
    }
    if (ok) return hint
  }

  return undefined
}

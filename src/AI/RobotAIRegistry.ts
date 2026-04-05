import type { RobotAIProvider } from './RobotAIProvider'

/**
 * RobotAIRegistry
 *
 * Multi-provider registry for AI implementations. Each provider registers
 * with an email pattern that matches the robot users it handles. At runtime,
 * the registry resolves the correct provider for a given robot email.
 *
 * Patterns use simple glob matching:
 * - 'gnu-*@nodots.com' matches all GNU skill-level robots
 * - 'gbg-bot@nodots.com' matches exact email
 * - '*' is the fallback catch-all
 *
 * Architecture:
 * 1. CORE defines the interface and registry (this file)
 * 2. AI package registers providers with email patterns
 * 3. CORE's executeRobotTurn() resolves provider by robot email
 * 4. Provider executes the turn with its own AI engine
 *
 * @example
 * ```typescript
 * import { RobotAIRegistry } from '@nodots-llc/backgammon-core'
 * import { GNUProvider } from './GNUProvider'
 * import { NodotsProvider } from './NodotsProvider'
 *
 * RobotAIRegistry.register('gnu-*', new GNUProvider())
 * RobotAIRegistry.register('nbg-*', new NodotsProvider())
 * RobotAIRegistry.register('*', new NodotsProvider()) // fallback
 * ```
 */

interface ProviderEntry {
  pattern: string
  provider: RobotAIProvider
}

function matchPattern(pattern: string, email: string): boolean {
  if (pattern === '*') return true
  // Convert glob pattern to regex: escape dots, replace * with .*
  const regex = new RegExp(
    '^' + pattern.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$'
  )
  return regex.test(email)
}

export class RobotAIRegistry {
  private static providers: ProviderEntry[] = []

  /**
   * Register a provider for robots matching the given email pattern.
   * More specific patterns should be registered before the '*' fallback.
   */
  static register(pattern: string, provider: RobotAIProvider): void {
    // Replace existing entry for same pattern
    const idx = this.providers.findIndex((e) => e.pattern === pattern)
    if (idx >= 0) {
      this.providers[idx] = { pattern, provider }
    } else {
      this.providers.push({ pattern, provider })
    }
  }

  /**
   * Resolve the provider for a given robot email.
   * Checks patterns in registration order; first match wins.
   */
  static getProvider(robotEmail?: string): RobotAIProvider {
    if (robotEmail) {
      for (const entry of this.providers) {
        if (matchPattern(entry.pattern, robotEmail)) {
          return entry.provider
        }
      }
    }

    // Try fallback '*' pattern
    const fallback = this.providers.find((e) => e.pattern === '*')
    if (fallback) return fallback.provider

    throw new Error(
      `No RobotAIProvider registered for robot email "${robotEmail || 'unknown'}". ` +
      'Ensure @nodots-llc/backgammon-ai is installed and imported before executing robot turns.'
    )
  }

  /**
   * Check if any provider is registered.
   */
  static hasProvider(): boolean {
    return this.providers.length > 0
  }

  /**
   * Clear all registered providers (for testing).
   */
  static clear(): void {
    this.providers = []
  }
}

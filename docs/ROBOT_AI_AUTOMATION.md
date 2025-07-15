# 🤖 Robot AI Automation - Technical API Documentation

## 📋 **Overview**

The Robot AI Automation system provides intelligent, automated gameplay for robot players in core. This system enables robots to make moves automatically, handle doubling cube decisions, and play at different difficulty levels without human intervention.

---

## 🔧 **Core API**

### **RobotAIService**

The main service class that provides robot AI functionality.

```typescript
import { RobotAIService } from '@nodots-llc/backgammon-ai'

const robotAI = new RobotAIService()
```

#### **Key Methods**

```typescript
interface RobotAIService {
  // Generate move for current game state
  generateMove(gameState: GameState, difficulty: RobotDifficulty): Promise<Move>

  // Doubling cube decision making
  shouldOfferDouble(
    gameState: GameState,
    difficulty: RobotDifficulty
  ): Promise<boolean>
  shouldAcceptDouble(
    gameState: GameState,
    difficulty: RobotDifficulty
  ): Promise<boolean>

  // Batch processing for multiple robots
  generateMovesForMultipleRobots(games: GameState[]): Promise<Move[]>

  // Utility methods
  evaluatePosition(gameState: GameState): number
  isValidMove(move: Move, gameState: GameState): boolean
}
```

---

## 🎮 **Usage Examples**

### **Basic Robot Move Generation**

```typescript
import { RobotAIService, RobotDifficulty } from '@nodots-llc/backgammon-ai'

const robotAI = new RobotAIService()

async function handleRobotTurn(game: Game, player: Player): Promise<void> {
  const difficulty: RobotDifficulty = player.difficulty || 'intermediate'
  const gameState = game.getCurrentState()

  try {
    // Generate move for robot
    const move = await robotAI.generateMove(gameState, difficulty)

    // Validate and apply move
    if (game.isValidMove(move)) {
      await game.applyMove(move)
      console.log(`Robot ${player.name} played: ${move.from} → ${move.to}`)
    } else {
      console.error('Invalid robot move generated')
    }
  } catch (error) {
    console.error('Robot move generation failed:', error)
  }
}
```

### **Complete Game Loop Integration**

```typescript
async function processGameTurn(game: Game): Promise<void> {
  const currentPlayer = game.getCurrentPlayer()

  if (currentPlayer.type === 'robot') {
    // Robot's turn - automate move
    await handleRobotTurn(game, currentPlayer)

    // Check if game continues
    if (!game.isGameOver()) {
      // Continue to next turn
      await processGameTurn(game)
    }
  } else {
    // Human player's turn - wait for input
    await waitForHumanInput(game)
  }
}
```

### **Doubling Cube Automation**

```typescript
async function handleDoublingCube(game: Game, player: Player): Promise<void> {
  const difficulty = player.difficulty || 'intermediate'
  const gameState = game.getCurrentState()

  // Check if robot should offer double
  if (game.canOfferDouble(player.id)) {
    const shouldOffer = await robotAI.shouldOfferDouble(gameState, difficulty)

    if (shouldOffer) {
      await game.offerDouble(player.id)
      console.log(`Robot ${player.name} offered double`)
    }
  }

  // Check if robot should accept double
  if (game.isPendingDouble(player.id)) {
    const shouldAccept = await robotAI.shouldAcceptDouble(gameState, difficulty)

    if (shouldAccept) {
      await game.acceptDouble(player.id)
      console.log(`Robot ${player.name} accepted double`)
    } else {
      await game.declineDouble(player.id)
      console.log(`Robot ${player.name} declined double`)
    }
  }
}
```

---

## 🎯 **Difficulty Levels**

### **Beginner** (`'beginner'`)

```typescript
const beginnerConfig = {
  randomness: 0.3, // 30% random moves
  lookahead: 1, // 1 move ahead
  safety: 0.7, // 70% prioritize safety
  aggression: 0.2, // 20% aggressive plays
  doubling: 'simple', // Basic doubling decisions
}
```

**Characteristics:**

- Prioritizes piece safety over position
- Makes some random moves for unpredictability
- Simple doubling cube strategy
- Perfect for new players

### **Intermediate** (`'intermediate'`)

```typescript
const intermediateConfig = {
  randomness: 0.1, // 10% random moves
  lookahead: 2, // 2 moves ahead
  safety: 0.5, // 50% prioritize safety
  aggression: 0.4, // 40% aggressive plays
  doubling: 'moderate', // Moderate doubling strategy
}
```

**Characteristics:**

- Balances safety and aggression
- Considers pip count in decisions
- Moderate doubling cube play
- Good for casual players

### **Advanced** (`'advanced'`)

```typescript
const advancedConfig = {
  randomness: 0.05, // 5% random moves
  lookahead: 3, // 3 moves ahead
  safety: 0.3, // 30% prioritize safety
  aggression: 0.6, // 60% aggressive plays
  doubling: 'expert', // Expert doubling strategy
}
```

**Characteristics:**

- Strategic position evaluation
- Complex doubling cube decisions
- Opening book knowledge
- Challenging for experienced players

---

## 🔄 **Integration Patterns**

### **Pattern 1: Event-Driven Integration**

```typescript
class GameManager {
  private robotAI: RobotAIService

  constructor() {
    this.robotAI = new RobotAIService()
  }

  async onPlayerTurn(gameId: string, playerId: string): Promise<void> {
    const game = await this.getGame(gameId)
    const player = game.getPlayer(playerId)

    if (player.type === 'robot') {
      await this.processRobotTurn(game, player)
    }
  }

  private async processRobotTurn(game: Game, player: Player): Promise<void> {
    const move = await this.robotAI.generateMove(
      game.getCurrentState(),
      player.difficulty
    )

    await game.applyMove(move)
    this.emit('robotMoveMade', { gameId: game.id, move })
  }
}
```

### **Pattern 2: Middleware Integration**

```typescript
function robotAutomationMiddleware(game: Game) {
  return async (next: Function) => {
    const currentPlayer = game.getCurrentPlayer()

    if (currentPlayer.type === 'robot') {
      // Handle robot turn automatically
      await handleRobotTurn(game, currentPlayer)
    }

    await next()
  }
}

// Usage
app.use(robotAutomationMiddleware)
```

### **Pattern 3: Background Processing**

```typescript
class RobotTaskQueue {
  private robotAI: RobotAIService
  private queue: Array<{ gameId: string; playerId: string }> = []

  constructor() {
    this.robotAI = new RobotAIService()
    this.startProcessing()
  }

  enqueue(gameId: string, playerId: string): void {
    this.queue.push({ gameId, playerId })
  }

  private async startProcessing(): Promise<void> {
    setInterval(async () => {
      if (this.queue.length > 0) {
        const task = this.queue.shift()
        await this.processRobotTask(task)
      }
    }, 100)
  }

  private async processRobotTask(task: {
    gameId: string
    playerId: string
  }): Promise<void> {
    const game = await this.getGame(task.gameId)
    const player = game.getPlayer(task.playerId)

    if (player.type === 'robot') {
      const move = await this.robotAI.generateMove(
        game.getCurrentState(),
        player.difficulty
      )
      await game.applyMove(move)
    }
  }
}
```

---

## 🏗️ **Custom Analyzers**

### **Creating Custom Position Evaluators**

```typescript
interface PositionEvaluator {
  evaluate(gameState: GameState, difficulty: RobotDifficulty): number
}

class CustomPositionEvaluator implements PositionEvaluator {
  evaluate(gameState: GameState, difficulty: RobotDifficulty): number {
    let score = 0

    // Pip count evaluation
    score += this.evaluatePipCount(gameState)

    // Piece distribution
    score += this.evaluatePieceDistribution(gameState)

    // Strategic position
    score += this.evaluateStrategicPosition(gameState)

    return score
  }

  private evaluatePipCount(gameState: GameState): number {
    const myPips = gameState.calculatePipCount(gameState.currentPlayer.id)
    const opponentPips = gameState.calculatePipCount(gameState.opponent.id)
    return opponentPips - myPips // Lower is better
  }

  private evaluatePieceDistribution(gameState: GameState): number {
    // Custom logic for piece distribution evaluation
    return 0
  }

  private evaluateStrategicPosition(gameState: GameState): number {
    // Custom strategic evaluation
    return 0
  }
}

// Usage
const customEvaluator = new CustomPositionEvaluator()
const robotAI = new RobotAIService({
  positionEvaluator: customEvaluator,
})
```

### **Custom Move Generators**

```typescript
interface MoveGenerator {
  generateMoves(gameState: GameState): Move[]
}

class CustomMoveGenerator implements MoveGenerator {
  generateMoves(gameState: GameState): Move[] {
    const moves: Move[] = []

    // Generate all legal moves
    const legalMoves = this.getAllLegalMoves(gameState)

    // Apply custom filtering and ranking
    const rankedMoves = this.rankMoves(legalMoves, gameState)

    return rankedMoves
  }

  private getAllLegalMoves(gameState: GameState): Move[] {
    // Implementation for generating all legal moves
    return []
  }

  private rankMoves(moves: Move[], gameState: GameState): Move[] {
    // Custom ranking logic
    return moves.sort((a, b) => {
      const scoreA = this.evaluateMove(a, gameState)
      const scoreB = this.evaluateMove(b, gameState)
      return scoreB - scoreA // Higher score first
    })
  }

  private evaluateMove(move: Move, gameState: GameState): number {
    // Custom move evaluation logic
    return 0
  }
}
```

---

## ⚡ **Performance Optimization**

### **Caching Strategies**

```typescript
class CachedRobotAIService extends RobotAIService {
  private moveCache = new Map<string, Move>()
  private positionCache = new Map<string, number>()

  async generateMove(
    gameState: GameState,
    difficulty: RobotDifficulty
  ): Promise<Move> {
    const cacheKey = this.generateCacheKey(gameState, difficulty)

    if (this.moveCache.has(cacheKey)) {
      return this.moveCache.get(cacheKey)!
    }

    const move = await super.generateMove(gameState, difficulty)
    this.moveCache.set(cacheKey, move)

    return move
  }

  private generateCacheKey(
    gameState: GameState,
    difficulty: RobotDifficulty
  ): string {
    return `${gameState.boardHash}-${difficulty}`
  }
}
```

### **Batch Processing**

```typescript
class BatchRobotProcessor {
  private robotAI: RobotAIService

  constructor() {
    this.robotAI = new RobotAIService()
  }

  async processBatch(
    games: Array<{ game: Game; player: Player }>
  ): Promise<Move[]> {
    const gameStates = games.map(({ game, player }) => ({
      state: game.getCurrentState(),
      difficulty: player.difficulty || 'intermediate',
    }))

    // Process all games in parallel
    const moves = await Promise.all(
      gameStates.map(({ state, difficulty }) =>
        this.robotAI.generateMove(state, difficulty)
      )
    )

    return moves
  }
}
```

---

## 🛠️ **Configuration Options**

### **Service Configuration**

```typescript
interface RobotAIConfig {
  maxThinkTime?: number // Maximum time per move (ms)
  cacheSize?: number // Move cache size
  enableLogging?: boolean // Enable debug logging
  customEvaluator?: PositionEvaluator
  customMoveGenerator?: MoveGenerator
}

const robotAI = new RobotAIService({
  maxThinkTime: 5000, // 5 seconds max
  cacheSize: 1000, // Cache 1000 positions
  enableLogging: true, // Enable debug logs
})
```

### **Difficulty Customization**

```typescript
interface DifficultyConfig {
  randomness: number // 0-1, amount of randomness
  lookahead: number // Number of moves to look ahead
  safety: number // 0-1, prioritize piece safety
  aggression: number // 0-1, prioritize aggressive plays
  doubling: 'simple' | 'moderate' | 'expert'
}

const customDifficulty: DifficultyConfig = {
  randomness: 0.15,
  lookahead: 2,
  safety: 0.6,
  aggression: 0.3,
  doubling: 'moderate',
}

robotAI.setDifficultyConfig('custom', customDifficulty)
```

---

## 🔍 **Debugging & Monitoring**

### **Debug Mode**

```typescript
const robotAI = new RobotAIService({
  enableLogging: true,
  logLevel: 'debug',
})

// Enable detailed move analysis
robotAI.enableMoveAnalysis(true)

// Get move reasoning
const moveAnalysis = await robotAI.generateMoveWithAnalysis(
  gameState,
  difficulty
)
console.log('Move reasoning:', moveAnalysis.reasoning)
console.log('Considered moves:', moveAnalysis.alternatives)
```

### **Performance Monitoring**

```typescript
class MonitoredRobotAIService extends RobotAIService {
  private metrics = {
    moveCount: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
  }

  async generateMove(
    gameState: GameState,
    difficulty: RobotDifficulty
  ): Promise<Move> {
    const startTime = Date.now()

    const move = await super.generateMove(gameState, difficulty)

    const responseTime = Date.now() - startTime
    this.updateMetrics(responseTime)

    return move
  }

  private updateMetrics(responseTime: number): void {
    this.metrics.moveCount++
    this.metrics.averageResponseTime =
      (this.metrics.averageResponseTime * (this.metrics.moveCount - 1) +
        responseTime) /
      this.metrics.moveCount
  }

  getMetrics() {
    return this.metrics
  }
}
```

---

## 📊 **Testing Integration**

### **Unit Testing Robot AI**

```typescript
describe('RobotAIService', () => {
  let robotAI: RobotAIService

  beforeEach(() => {
    robotAI = new RobotAIService()
  })

  test('generates valid moves for all difficulties', async () => {
    const gameState = createTestGameState()
    const difficulties: RobotDifficulty[] = [
      'beginner',
      'intermediate',
      'advanced',
    ]

    for (const difficulty of difficulties) {
      const move = await robotAI.generateMove(gameState, difficulty)
      expect(gameState.isValidMove(move)).toBe(true)
    }
  })

  test('respects difficulty differences', async () => {
    const gameState = createTestGameState()

    const beginnerMove = await robotAI.generateMove(gameState, 'beginner')
    const advancedMove = await robotAI.generateMove(gameState, 'advanced')

    // Advanced should make better moves (higher evaluation)
    const beginnerScore = robotAI.evaluateMove(beginnerMove, gameState)
    const advancedScore = robotAI.evaluateMove(advancedMove, gameState)

    expect(advancedScore).toBeGreaterThanOrEqual(beginnerScore)
  })
})
```

### **Integration Testing**

```typescript
describe('Robot Game Integration', () => {
  test('completes human vs robot game', async () => {
    const game = createGame('human', 'robot')

    // Simulate game until completion
    while (!game.isGameOver()) {
      if (game.getCurrentPlayer().type === 'robot') {
        await handleRobotTurn(game, game.getCurrentPlayer())
      } else {
        // Simulate human move
        await game.makeMove(generateRandomHumanMove(game))
      }
    }

    expect(game.isGameOver()).toBe(true)
    expect(game.getWinner()).toBeDefined()
  })
})
```

---

## 🎯 **Production Deployment**

### **Environment Configuration**

```typescript
// production.config.ts
export const productionConfig: RobotAIConfig = {
  maxThinkTime: 3000, // 3 seconds in production
  cacheSize: 5000, // Larger cache for production
  enableLogging: false, // Disable debug logging
}

// Initialize for production
const robotAI = new RobotAIService(productionConfig)
```

### **Health Checks**

```typescript
class RobotAIHealthCheck {
  private robotAI: RobotAIService

  constructor(robotAI: RobotAIService) {
    this.robotAI = robotAI
  }

  async checkHealth(): Promise<boolean> {
    try {
      const testGameState = createMinimalGameState()
      const move = await this.robotAI.generateMove(testGameState, 'beginner')
      return move !== null
    } catch (error) {
      console.error('Robot AI health check failed:', error)
      return false
    }
  }
}
```

---

## 🎉 **Ready for Production**

The Robot AI Automation system is production-ready with:

✅ **Complete API** - All methods implemented and tested  
✅ **Multiple Difficulty Levels** - Beginner, Intermediate, Advanced  
✅ **Performance Optimized** - Fast response times with caching  
✅ **Comprehensive Testing** - Unit and integration tests  
✅ **Flexible Integration** - Multiple integration patterns  
✅ **Monitoring & Debugging** - Built-in logging and metrics  
✅ **Production Configuration** - Optimized for deployment

**The core team can now integrate this system and solve the robot automation challenge!** 🚀

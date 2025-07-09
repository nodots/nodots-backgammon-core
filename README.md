# @nodots-llc/backgammon-ai

Advanced AI engine for nodots backgammon with sophisticated move selection and strategic analysis.

## Features

- **Multi-difficulty AI**: Beginner, Intermediate, and Advanced levels
- **Strategic Analysis**: Game phase recognition and phase-appropriate strategies
- **Move Sequencing**: Multi-move sequence analysis and optimization
- **Opening Book**: Standard opening theory and recommendations
- **Doubling Cube**: Sophisticated doubling cube decision making
- **Position Evaluation**: Advanced position analysis and evaluation
- **Threat Assessment**: Blitz, backgame, and racing threat analysis

## Installation

```bash
npm install @nodots-llc/backgammon-ai
```

## Usage

```typescript
import { RobotAIService } from '@nodots-llc/backgammon-ai';

const ai = new RobotAIService();

// Generate a move
const move = await ai.generateMove(gameState, 'advanced');

// Evaluate position
const evaluation = await ai.evaluatePosition(gameState);

// Doubling cube decisions
const shouldDouble = await ai.shouldOfferDouble(gameState, 'intermediate');
const shouldTake = await ai.shouldAcceptDouble(gameState, 'intermediate');
```

## API Reference

### RobotAIService

The main AI service class that provides all AI functionality.

#### Methods

- `generateMove(gameState, difficulty)`: Generate optimal move
- `shouldOfferDouble(gameState, difficulty)`: Doubling cube decisions
- `shouldAcceptDouble(gameState, difficulty)`: Take/pass decisions
- `evaluatePosition(gameState)`: Position evaluation
- `explainMove(move, gameState)`: Move explanation
- `getOpeningRecommendation(roll, gameState)`: Opening book recommendations

### Difficulty Levels

- **Beginner**: Basic safety and progress
- **Intermediate**: Position evaluation and basic strategy
- **Advanced**: Complex analysis and sophisticated strategy

## Contributing

This package is designed to work with the nodots backgammon ecosystem. See the main project for contribution guidelines.

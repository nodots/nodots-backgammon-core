"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Game_1 = require("../Game");
const Board_1 = require("../Board");
const Player_1 = require("../Player");
const __1 = require("..");
function simulateGame() {
    // Initial game setup
    const clockwiseColor = (0, __1.randomBackgammonColor)();
    const counterclockwiseColor = clockwiseColor === 'black' ? 'white' : 'black';
    const players = [
        Player_1.Player.initialize(clockwiseColor, 'clockwise'),
        Player_1.Player.initialize(counterclockwiseColor, 'counterclockwise'),
    ];
    // Start game
    let game = Game_1.Game.initialize(players);
    console.log('\nInitial board state:');
    console.log(Board_1.Board.getAsciiBoard(game.board));
    // Roll for start to determine first player
    const gameRolling = Game_1.Game.rollForStart(game);
    console.log(`\nFirst player: ${gameRolling.activeColor}`);
    // Game loop
    let currentGame = gameRolling;
    let turnCount = 0;
    let winner = null;
    while (!winner) {
        turnCount++;
        console.log(`\n=== Turn ${turnCount} ===`);
        // Convert to rolled-for-start state
        const rolledForStartGame = Object.assign(Object.assign({}, currentGame), { stateKind: 'rolled-for-start', players: [
                Object.assign(Object.assign({}, currentGame.activePlayer), { stateKind: 'rolling' }),
                Object.assign(Object.assign({}, currentGame.inactivePlayer), { stateKind: 'inactive' }),
            ] });
        // Roll dice
        let gameMoving = Game_1.Game.roll(rolledForStartGame);
        console.log(`\n${gameMoving.activeColor}'s roll: ${gameMoving.activePlay.moves
            .map((m) => m.dieValue)
            .join(', ')}`);
        // Make moves until no more valid moves are available
        let gameMoved = gameMoving;
        let moveCount = 0;
        // Keep making moves while there are moves with possible destinations
        while (gameMoved.activePlay.moves.some((m) => (m.stateKind === 'ready' ||
            (m.stateKind === 'in-progress' && !m.origin)) &&
            m.possibleMoves.length > 0)) {
            // Find the next move that has possible destinations
            const nextMove = gameMoved.activePlay.moves.find((m) => (m.stateKind === 'ready' ||
                (m.stateKind === 'in-progress' && !m.origin)) &&
                m.possibleMoves.length > 0);
            if (!nextMove) {
                break;
            }
            // Take the first possible move
            const validMove = nextMove.possibleMoves[0];
            moveCount++;
            const origin = validMove.origin;
            const destination = validMove.destination;
            console.log(`\nMove ${moveCount}: from ${origin.kind === 'point' ? origin.position.clockwise : 'bar'} to ${destination.kind === 'point' ? destination.position.clockwise : 'off'}`);
            try {
                gameMoved = Game_1.Game.move(gameMoved, origin);
                console.log('\nBoard after move:');
                console.log(Board_1.Board.getAsciiBoard(gameMoved.board));
                // Check if this player has won after the move
                const playerOffPosition = gameMoved.board.off[gameMoved.activePlayer.direction];
                const playerCheckers = playerOffPosition.checkers.filter((checker) => checker.color === gameMoved.activeColor);
                // A player wins when they have all 15 checkers in their off position
                if (playerCheckers.length === 15) {
                    winner = gameMoved.activeColor;
                    break;
                }
            }
            catch (error) {
                console.log(`\nCouldn't make move: ${error}`);
                break;
            }
        }
        if (moveCount === 0) {
            console.log(`\n${gameMoved.activeColor} has no valid moves this turn`);
        }
        if (!winner) {
            // Switch turns if no winner yet
            currentGame = Game_1.Game.switchTurn(gameMoved);
            console.log(`\nSwitching to ${currentGame.activeColor}'s turn`);
        }
    }
    // Display final game state and winner
    console.log('\n=== GAME OVER ===');
    console.log(`Winner: ${winner}`);
    console.log('\nFinal board state:');
    console.log(Board_1.Board.getAsciiBoard(currentGame.board));
    console.log(`\nGame completed in ${turnCount} turns`);
}
// Run the simulation
simulateGame();

"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSimulation = runSimulation;
const __1 = require("..");
function displayTurnInfo(turnNumber, activeColor, roll) {
    console.log(`\n=== Turn ${turnNumber} ===\n`);
    console.log(`${activeColor}'s roll: ${roll.join(', ')}\n`);
}
function displayMoveInfo(moveNumber, origin, destination) {
    const originStr = origin.kind === 'point' ? origin.position.clockwise : 'bar';
    const destStr = destination.kind === 'point' ? destination.position.clockwise : 'off';
    console.log(`Move ${moveNumber}: from ${originStr} to ${destStr}\n`);
}
function getStats(board) {
    const whiteBar = board.bar.clockwise.checkers.filter((c) => c.color === 'white')
        .length +
        board.bar.counterclockwise.checkers.filter((c) => c.color === 'white')
            .length;
    const blackBar = board.bar.clockwise.checkers.filter((c) => c.color === 'black')
        .length +
        board.bar.counterclockwise.checkers.filter((c) => c.color === 'black')
            .length;
    const whiteOff = board.off.clockwise.checkers.filter((c) => c.color === 'white')
        .length +
        board.off.counterclockwise.checkers.filter((c) => c.color === 'white')
            .length;
    const blackOff = board.off.clockwise.checkers.filter((c) => c.color === 'black')
        .length +
        board.off.counterclockwise.checkers.filter((c) => c.color === 'black')
            .length;
    return {
        totalTurns: 0, // Will be updated in main function
        totalMoves: 0, // Will be updated in main function
        whiteCheckersCaptured: whiteBar,
        blackCheckersCaptured: blackBar,
        whiteCheckersOff: whiteOff,
        blackCheckersOff: blackOff,
    };
}
function displayStats(stats) {
    console.log('\n=== Simulation Statistics ===');
    console.log(`Total Turns: ${stats.totalTurns}`);
    console.log(`Total Moves: ${stats.totalMoves}`);
    console.log(`White Checkers Captured: ${stats.whiteCheckersCaptured}`);
    console.log(`Black Checkers Captured: ${stats.blackCheckersCaptured}`);
    console.log(`White Checkers Off: ${stats.whiteCheckersOff}`);
    console.log(`Black Checkers Off: ${stats.blackCheckersOff}`);
}
function checkWinCondition(board) {
    // A player wins if all their checkers are off the board
    const whiteCheckersOff = board.off.clockwise.checkers.filter((c) => c.color === 'white')
        .length +
        board.off.counterclockwise.checkers.filter((c) => c.color === 'white')
            .length;
    const blackCheckersOff = board.off.clockwise.checkers.filter((c) => c.color === 'black')
        .length +
        board.off.counterclockwise.checkers.filter((c) => c.color === 'black')
            .length;
    if (whiteCheckersOff === 15)
        return 'white';
    if (blackCheckersOff === 15)
        return 'black';
    return null;
}
function runSimulation() {
    return __awaiter(this, arguments, void 0, function* (maxTurns = 100) {
        // Initialize players
        const whitePlayer = __1.Player.initialize('white', 'clockwise');
        const blackPlayer = __1.Player.initialize('black', 'counterclockwise');
        const players = [whitePlayer, blackPlayer];
        // Initialize game
        let game = __1.Game.initialize(players);
        let turnCount = 0;
        let totalMoves = 0;
        let lastBoard = game.board;
        // Roll for start
        let gameRolling = __1.Game.rollForStart(game);
        console.log('Initial board state:');
        __1.Board.displayAsciiBoard(gameRolling.board);
        // If maxTurns is 0, run until there's a winner
        const shouldRunUntilWinner = maxTurns === 0;
        while (shouldRunUntilWinner || turnCount < maxTurns) {
            turnCount++;
            // Convert to rolled-for-start state for the roll
            const rolledForStartGame = Object.assign(Object.assign({}, gameRolling), { stateKind: 'rolled-for-start', players: [
                    Object.assign(Object.assign({}, gameRolling.activePlayer), { stateKind: 'rolling' }),
                    Object.assign(Object.assign({}, gameRolling.inactivePlayer), { stateKind: 'inactive' }),
                ] });
            // Roll dice
            let gameMoving = __1.Game.roll(rolledForStartGame);
            const roll = gameMoving.activePlayer.dice
                .currentRoll;
            displayTurnInfo(turnCount, gameMoving.activeColor, roll);
            // Make moves until no more valid moves are available
            let moveCount = 0;
            let gameMoved = gameMoving;
            try {
                while (gameMoved.activePlay.moves.some((m) => (m.stateKind === 'ready' ||
                    (m.stateKind === 'in-progress' && !m.origin)) &&
                    m.possibleMoves.length > 0)) {
                    const nextMove = gameMoved.activePlay.moves.find((m) => (m.stateKind === 'ready' ||
                        (m.stateKind === 'in-progress' && !m.origin)) &&
                        m.possibleMoves.length > 0);
                    if (!nextMove || nextMove.possibleMoves.length === 0) {
                        break;
                    }
                    // Recalculate possible moves for this die value based on current board state
                    const possibleMoves = __1.Board.getPossibleMoves(gameMoved.board, nextMove.player, nextMove.dieValue);
                    // Display all possible moves for this die value
                    console.log(`\nPossible moves for die value ${nextMove.dieValue}:`);
                    possibleMoves.forEach((possibleMove, index) => {
                        const fromPoint = possibleMove.origin.kind === 'point'
                            ? possibleMove.origin.position.clockwise
                            : 'bar';
                        const checkerCount = possibleMove.origin.kind === 'point'
                            ? possibleMove.origin.checkers.length
                            : possibleMove.origin.checkers.length;
                        const toPoint = possibleMove.destination.kind === 'point'
                            ? possibleMove.destination.position.clockwise
                            : 'off';
                        console.log(`  ${index + 1}: from ${fromPoint} (${checkerCount} checkers) to ${toPoint}`);
                    });
                    // Take the first valid move that has checkers
                    let validMove = null;
                    for (const move of possibleMoves) {
                        const origin = move.origin;
                        const checkers = origin.checkers;
                        if (checkers.length > 0 &&
                            checkers[0].color === gameMoved.activeColor) {
                            validMove = move;
                            break;
                        }
                    }
                    if (!validMove) {
                        console.log('\nNo valid moves with checkers found');
                        break;
                    }
                    const origin = validMove.origin;
                    const destination = validMove.destination;
                    console.log(`\nMove ${moveCount + 1}: from ${origin.kind === 'point' ? origin.position.clockwise : 'bar'} to ${destination.kind === 'point'
                        ? destination.position.clockwise
                        : 'off'}`);
                    console.log('\nBoard before move:');
                    __1.Board.displayAsciiBoard(gameMoved.board);
                    try {
                        const moveResult = __1.Game.move(gameMoved, origin);
                        if ('board' in moveResult) {
                            gameMoved = moveResult;
                            moveCount++;
                            console.log('\nBoard after move:');
                            __1.Board.displayAsciiBoard(gameMoved.board);
                            // Show remaining moves
                            console.log('\nRemaining moves:');
                            gameMoved.activePlay.moves.forEach((move) => {
                                // Update possible moves for this die value
                                move.possibleMoves = __1.Board.getPossibleMoves(gameMoved.board, move.player, move.dieValue);
                                console.log(`  Die value ${move.dieValue}: ${move.possibleMoves.length} possible moves`);
                            });
                        }
                    }
                    catch (error) {
                        console.log(`\nCouldn't make move: ${error}`);
                        break;
                    }
                }
            }
            catch (error) {
                console.log(`Error during moves: ${error}\n`);
                // Use the last valid board state
                gameMoved = Object.assign(Object.assign({}, gameMoved), { board: lastBoard });
            }
            // Check for winner
            const winner = checkWinCondition(lastBoard);
            if (winner) {
                console.log(`\n${winner.toUpperCase()} WINS!\n`);
                break;
            }
            // Switch turns
            console.log(`Switching to ${gameMoved.inactivePlayer.color}'s turn\n`);
            gameRolling = __1.Game.switchTurn(gameMoved);
        }
        // Display final statistics
        const stats = getStats(lastBoard);
        stats.totalTurns = turnCount;
        stats.totalMoves = totalMoves;
        displayStats(stats);
    });
}
// Allow running from command line with optional max turns argument
if (require.main === module) {
    const maxTurns = process.argv[2] ? parseInt(process.argv[2]) : 100;
    runSimulation(maxTurns).catch(console.error);
}

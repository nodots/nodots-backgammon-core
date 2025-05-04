"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Board = exports.BOARD_POINT_COUNT = void 0;
const __1 = require("..");
const ascii_1 = require("./ascii");
const imports_1 = require("./imports");
exports.BOARD_POINT_COUNT = 24;
class Board {
    static initialize(boardImport) {
        if (!boardImport)
            boardImport = imports_1.BOARD_IMPORT_DEFAULT;
        const board = Board.buildBoard(boardImport);
        if (!board)
            throw Error('No board found');
        console.log('Board initialized:', Board.displayAsciiBoard(board));
        return board;
    }
    static moveChecker(board, origin, destination, direction) {
        if (!board)
            throw Error('No board found');
        const opponentDirection = direction === 'clockwise' ? 'counterclockwise' : 'clockwise';
        // Create a deep clone of the board
        const boardClone = JSON.parse(JSON.stringify(board));
        // Get references to the cloned containers
        const originClone = this.getCheckercontainer(boardClone, origin.id);
        const destinationClone = this.getCheckercontainer(boardClone, destination.id);
        const opponentBarClone = boardClone.bar[opponentDirection];
        // Get the checker to move and preserve its color
        const checker = originClone.checkers[originClone.checkers.length - 1];
        if (!checker)
            throw Error('No checker found');
        const movingCheckerColor = checker.color;
        // Remove the checker from origin
        originClone.checkers.pop();
        // Handle hit
        if (destinationClone.checkers.length === 1 &&
            destinationClone.checkers[0].color !== movingCheckerColor) {
            // Get the hit checker and preserve its color
            const hitChecker = destinationClone.checkers[0];
            const hitCheckerColor = hitChecker.color;
            // Move the hit checker to the opponent's bar
            destinationClone.checkers = [];
            opponentBarClone.checkers.push({
                id: hitChecker.id,
                color: hitCheckerColor,
                checkercontainerId: opponentBarClone.id,
            });
        }
        else {
            // Clear the destination if it's not a hit
            destinationClone.checkers = [];
        }
        // Place the moving checker with its original color
        destinationClone.checkers = [
            {
                id: checker.id,
                color: movingCheckerColor,
                checkercontainerId: destinationClone.id,
            },
        ];
        return boardClone;
    }
    static getCheckers(board) {
        const checkercontainers = Board.getCheckercontainers(board);
        const checkers = [];
        checkercontainers.map(function pushCheckers(checkercontainer) {
            checkers.push(...checkercontainer.checkers);
        });
        return checkers;
    }
    static getCheckersForColor(board, color) {
        return Board.getCheckers(board).filter(function filterCheckers(checker) {
            return checker.color === color;
        });
    }
    static buildBoard(boardImport) {
        if (!boardImport)
            boardImport = imports_1.BOARD_IMPORT_DEFAULT;
        const tempPoints = [];
        for (let i = 0; i < exports.BOARD_POINT_COUNT; i++) {
            const pointId = (0, __1.generateId)();
            const checkers = [];
            const clockwisePosition = (i + 1);
            const counterclockwisePosition = (25 -
                clockwisePosition);
            const point = {
                id: pointId,
                kind: 'point',
                position: {
                    clockwise: clockwisePosition,
                    counterclockwise: counterclockwisePosition,
                },
                checkers: checkers,
            };
            tempPoints.push(point);
        }
        if (tempPoints.length !== exports.BOARD_POINT_COUNT)
            throw Error('Invalid tempPoints length');
        const points = tempPoints;
        points.map(function mapPoints(point) {
            const pointSpecs = boardImport.filter(function findPointSpec(cc) {
                if (typeof cc.position === 'object' && 'clockwise' in cc.position) {
                    return (cc.position.clockwise === point.position.clockwise &&
                        cc.position.counterclockwise === point.position.counterclockwise);
                }
                return false;
            });
            if (pointSpecs.length > 0) {
                pointSpecs.forEach((pointSpec) => {
                    if (pointSpec.checkers) {
                        const checkers = __1.Checker.buildCheckersForCheckercontainerId(point.id, pointSpec.checkers.color, pointSpec.checkers.qty);
                        point.checkers.push(...checkers);
                    }
                });
            }
        });
        const bar = this.buildBar(boardImport);
        const off = this.buildOff(boardImport);
        const board = {
            id: (0, __1.generateId)(),
            BackgammonPoints: points,
            bar,
            off,
        };
        return board;
    }
}
exports.Board = Board;
Board.getPoints = function getPoints(board) {
    return board.BackgammonPoints;
};
Board.getBars = function getBars(board) {
    return [board.bar.clockwise, board.bar.counterclockwise];
};
Board.getOffs = function getOffs(board) {
    return [board.off.clockwise, board.off.counterclockwise];
};
Board.getCheckercontainers = function getCheckercontainers(board) {
    const points = Board.getPoints(board);
    const bar = Board.getBars(board);
    const off = Board.getOffs(board);
    return points.concat(...bar).concat(...off);
};
Board.getCheckercontainer = function getCheckercontainer(board, id) {
    const container = Board.getCheckercontainers(board).find(function findContainer(c) {
        return c.id === id;
    });
    if (!container) {
        throw Error(`No checkercontainer found for ${id}`);
    }
    return container;
};
Board.getPossibleMoves = function getPossibleMoves(board, player, dieValue) {
    const possibleMoves = [];
    const playerPoints = Board.getPoints(board).filter((p) => p.checkers.length > 0 && p.checkers[0].color === player.color);
    const playerDirection = player.direction;
    const bar = board.bar[playerDirection];
    // player is the winner! Need to do more here
    if (playerPoints.length === 0 && bar.checkers.length === 0) {
        return possibleMoves;
    }
    if (bar.checkers.length > 0) {
        const reentryPoint = playerDirection === 'clockwise' ? 25 - dieValue : dieValue;
        const possibleDestination = Board.getPoints(board).find((p) => p.checkers.length < 2 &&
            (playerDirection === 'clockwise'
                ? p.position.clockwise === reentryPoint
                : p.position.counterclockwise === reentryPoint));
        if (possibleDestination) {
            possibleMoves.push({
                origin: bar,
                destination: possibleDestination,
                dieValue,
                direction: playerDirection,
            });
        }
        return possibleMoves;
    }
    else {
        playerPoints.map(function mapPlayerPoints(point) {
            const possibleDestination = Board.getPoints(board).find((p) => p.checkers.length < 2 &&
                p.position[playerDirection] ===
                    point.position[playerDirection] + dieValue);
            if (possibleDestination) {
                possibleMoves.push({
                    origin: point,
                    destination: possibleDestination,
                    dieValue,
                    direction: playerDirection,
                });
            }
        });
    }
    return possibleMoves;
};
Board.getPipCounts = function getPipCounts(game) {
    const { board, players } = game;
    const pipCounts = {
        black: 167,
        white: 167,
    };
    return pipCounts;
};
Board.buildBar = function buildBar(boardImport) {
    const clockwiseId = (0, __1.generateId)();
    const counterclockwiseId = (0, __1.generateId)();
    const barImport = boardImport.filter(function filterBarImport(cc) {
        return cc.position === 'bar';
    });
    const clockwiseBarImport = barImport.find(function findClockwiseBarImport(b) {
        return b.direction === 'clockwise';
    });
    let clockwiseCheckerCount = 0;
    const clockwiseCheckers = [];
    if (clockwiseBarImport) {
        if (clockwiseBarImport.checkers) {
            clockwiseCheckerCount = clockwiseBarImport.checkers.qty;
        }
        clockwiseCheckers.push(...__1.Checker.buildCheckersForCheckercontainerId(clockwiseId, clockwiseBarImport.checkers.color, clockwiseCheckerCount));
    }
    const counterclockwiseBarImport = barImport.find(function findCounterclockwiseBarImport(b) {
        return b.direction === 'counterclockwise';
    });
    let counterclockwiseCheckerCount = 0;
    const counterclockwiseCheckers = [];
    if (counterclockwiseBarImport) {
        if (counterclockwiseBarImport.checkers) {
            counterclockwiseCheckerCount = counterclockwiseBarImport.checkers.qty;
        }
        counterclockwiseCheckers.push(...__1.Checker.buildCheckersForCheckercontainerId(counterclockwiseId, counterclockwiseBarImport.checkers.color, counterclockwiseCheckerCount));
    }
    return {
        clockwise: {
            id: clockwiseId,
            kind: 'bar',
            position: 'bar',
            direction: 'clockwise',
            checkers: clockwiseCheckers,
        },
        counterclockwise: {
            id: counterclockwiseId,
            kind: 'bar',
            position: 'bar',
            direction: 'counterclockwise',
            checkers: counterclockwiseCheckers,
        },
    };
};
Board.buildOff = function buildOff(boardImport) {
    const offImport = boardImport.filter(function filterOffImport(cc) {
        return cc.position === 'off';
    });
    const clockwiseOffImport = offImport.find(function findClockwiseOffImport(b) {
        return b.direction === 'clockwise';
    });
    const counterclockwiseOffImport = offImport.find(function findCounterclockwiseOffImport(b) {
        return b.direction === 'counterclockwise';
    });
    const clockwiseCheckers = [];
    if (clockwiseOffImport) {
        if (clockwiseOffImport.checkers) {
            const checkerCount = clockwiseOffImport.checkers.qty;
            clockwiseCheckers.push(...__1.Checker.buildCheckersForCheckercontainerId((0, __1.generateId)(), clockwiseOffImport.checkers.color, checkerCount));
        }
    }
    const counterclockwiseCheckers = [];
    if (counterclockwiseOffImport) {
        if (counterclockwiseOffImport.checkers) {
            const checkerCount = counterclockwiseOffImport.checkers.qty;
            counterclockwiseCheckers.push(...__1.Checker.buildCheckersForCheckercontainerId((0, __1.generateId)(), counterclockwiseOffImport.checkers.color, checkerCount));
        }
    }
    return {
        clockwise: {
            id: (0, __1.generateId)(),
            kind: 'off',
            position: 'off',
            direction: 'clockwise',
            checkers: clockwiseCheckers,
        },
        counterclockwise: {
            id: (0, __1.generateId)(),
            kind: 'off',
            position: 'off',
            direction: 'counterclockwise',
            checkers: counterclockwiseCheckers,
        },
    };
};
Board.generateRandomBoard = () => {
    const boardImport = [];
    const addCheckersToImport = (color, positions) => {
        let checkerCount = 0;
        positions.forEach((position) => {
            let positionCheckerCount = Math.floor(Math.random() * 5) + 1;
            if (checkerCount + positionCheckerCount > 15) {
                positionCheckerCount = 15 - checkerCount;
            }
            checkerCount += positionCheckerCount;
            if (checkerCount <= 15) {
                boardImport.push({
                    position: {
                        clockwise: position,
                        counterclockwise: (25 - position),
                    },
                    checkers: {
                        color,
                        qty: positionCheckerCount,
                    },
                });
            }
        });
    };
    const generateRandomPositions = (count) => {
        const positions = new Set();
        while (positions.size < count) {
            const position = Math.floor(Math.random() * 24) + 1;
            positions.add(position);
        }
        return Array.from(positions);
    };
    let blackPositions = generateRandomPositions(5);
    let whitePositions = generateRandomPositions(5);
    // Ensure black and white positions do not overlap
    while (blackPositions.some((pos) => whitePositions.includes(pos))) {
        blackPositions = generateRandomPositions(5);
        whitePositions = generateRandomPositions(5);
    }
    // Ensure some points have more than one checker
    addCheckersToImport('black', blackPositions);
    addCheckersToImport('white', whitePositions);
    const totalBlackCheckers = boardImport.reduce((acc, cc) => {
        var _a;
        if (((_a = cc.checkers) === null || _a === void 0 ? void 0 : _a.color) === 'black') {
            acc += cc.checkers.qty;
        }
        return acc;
    }, 0);
    const totalWhiteCheckers = boardImport.reduce((acc, cc) => {
        var _a;
        if (((_a = cc.checkers) === null || _a === void 0 ? void 0 : _a.color) === 'white') {
            acc += cc.checkers.qty;
        }
        return acc;
    }, 0);
    if (totalBlackCheckers < 15) {
        const blackOffQty = 15 - totalBlackCheckers;
        boardImport.push({
            position: 'off',
            direction: 'clockwise',
            checkers: {
                color: 'black',
                qty: blackOffQty,
            },
        });
    }
    if (totalWhiteCheckers < 15) {
        const whiteOffQty = 15 - totalWhiteCheckers;
        boardImport.push({
            position: 'off',
            direction: 'counterclockwise',
            checkers: {
                color: 'white',
                qty: whiteOffQty,
            },
        });
    }
    return Board.buildBoard(boardImport);
};
Board.getAsciiBoard = (board) => (0, ascii_1.ascii)(board);
Board.displayAsciiBoard = (board) => {
    return board ? console.log((0, ascii_1.ascii)(board)) : console.error('No board found');
};

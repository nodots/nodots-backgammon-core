export { v4 as generateId } from 'uuid';
export type BackgammonColor = 'black' | 'white';
export type BackgammonMoveDirection = 'clockwise' | 'counterclockwise';
export type BackgammonEntity = 'board' | 'checker' | 'cube' | 'player' | 'play' | 'move' | 'game' | 'offer';
export declare const randomBoolean: () => boolean;
export declare const randomBackgammonColor: () => BackgammonColor;
export declare const randomBackgammonDirection: () => BackgammonMoveDirection;
export interface BackgammonError extends Error {
    entity: BackgammonEntity;
    message: string;
}
export declare const isValidUuid: (uuid: string) => boolean;
export * from './Board';
export { ascii } from './Board/ascii';
export * from './Checker';
export * from './Cube';
export * from './Dice';
export * from './Game';
export * from './History';
export * from './Move';
export * from './Play';
export * from './Player';
export * from './Services';
export { debug, error, info, logger, setConsoleEnabled, setIncludeCallerInfo, setLogLevel, warn, type LogLevel, } from './utils/logger';
export type * from '@nodots-llc/backgammon-types';
export { GameEventEmitter } from './events/GameEventEmitter';
//# sourceMappingURL=index.d.ts.map
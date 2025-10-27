import type { BackgammonGame } from '@nodots-llc/backgammon-types';
import { GameActionType, GameActionData, GameActionMetadata } from '@nodots-llc/backgammon-types';
export interface HistoryQueueInterface {
    enqueueAction(gameId: string, playerId: string, actionType: GameActionType, actionData: GameActionData, gameStateBefore: BackgammonGame, gameStateAfter: BackgammonGame, metadata?: Partial<GameActionMetadata>): Promise<void>;
}
export declare function setHistoryQueue(queue: HistoryQueueInterface): void;
export declare function enqueueHistoryAction(gameId: string, playerId: string, actionType: GameActionType, actionData: GameActionData, gameStateBefore: BackgammonGame, gameStateAfter: BackgammonGame, metadata?: Partial<GameActionMetadata>): Promise<void>;
//# sourceMappingURL=HistoryQueue.d.ts.map
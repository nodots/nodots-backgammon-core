import { BackgammonCube, BackgammonCubeDoubled, BackgammonCubeInitialized, BackgammonCubeMaxxed, BackgammonCubeStateKind, BackgammonCubeValue, BackgammonPlayer, BackgammonPlayers, CubeProps } from '@nodots-llc/backgammon-types';
export declare class Cube {
    id: string;
    stateKind: BackgammonCubeStateKind;
    value: BackgammonCubeValue;
    owner: BackgammonPlayer | undefined;
    static initialize(cube?: CubeProps): BackgammonCubeInitialized;
    static double: (cube: BackgammonCube, player: BackgammonPlayer, players: BackgammonPlayers) => BackgammonCubeDoubled | BackgammonCubeMaxxed;
}
//# sourceMappingURL=index.d.ts.map
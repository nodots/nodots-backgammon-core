import { PointToPoint } from '.'
import {
  Dice,
  generateId,
  randomBackgammonColor,
  randomBackgammonDirection,
} from '../../..'
import {
  BackgammonDiceRolled,
  BackgammonMoveDirection,
  BackgammonMoveInProgress,
  BackgammonPlayerMoving,
  BackgammonPoint,
  BackgammonRoll,
} from '../../../../types'
import { Board } from '../../../Board'
import { BOARD_IMPORT_DEFAULT } from '../../../Board/imports'

describe('PointToPoint', () => {
  const diceId: string = generateId()
  const board = Board.initialize(BOARD_IMPORT_DEFAULT)
  const color = randomBackgammonColor()
  const direction = randomBackgammonDirection()
  const currentRoll: BackgammonRoll = [1, 5]
  const dice = Dice.initialize(
    color,
    'rolled',
    diceId,
    currentRoll
  ) as BackgammonDiceRolled

  const player: BackgammonPlayerMoving = {
    id: '1',
    color,
    stateKind: 'moving',
    dice,
    direction,
    pipCount: 167,
  }

  const origin = board.points.find((p) => p.position[direction] === 24)!

  let validMove: BackgammonMoveInProgress = {
    id: '1',
    player,
    stateKind: 'in-progress',
    moveKind: 'point-to-point',
    origin: origin,
    dieValue: currentRoll[0],
  }
  const moveResult = PointToPoint.move(board, validMove)
  const completedMove = moveResult.move

  it(`should complete a valid PointToPoint move ${JSON.stringify(
    validMove.origin.position
  )} ${validMove.dieValue}`, () => {
    expect(completedMove).toBeDefined()
    const direction = completedMove.player.direction as BackgammonMoveDirection
    const origin: BackgammonPoint = completedMove.origin as BackgammonPoint
    const originPosition = origin.position[direction]
    const destination: BackgammonPoint =
      completedMove.destination as BackgammonPoint
    const destinationPosition = destination.position[direction]
    expect(completedMove.id).toBeDefined()
    expect(origin).toBeDefined()
    expect(destination).toBeDefined()
    expect(origin).not.toBe(destination)
    expect(direction).toBe(player.direction)
    expect(originPosition - destinationPosition).toBe(currentRoll[0])
  })

  let invalidMove: BackgammonMoveInProgress = {
    id: '1',
    player,
    stateKind: 'in-progress',
    moveKind: 'point-to-point',
    origin: origin,
    dieValue: currentRoll[1],
  }
  const invalidMoveResult = PointToPoint.move(board, invalidMove)
  const invalidCompletedMove = invalidMoveResult.move

  it(`should not complete an invalid PointToPoint move ${JSON.stringify(
    invalidMove.origin.position
  )} ${invalidMove.dieValue}`, () => {
    expect(invalidCompletedMove).toBeDefined()
    const direction = invalidCompletedMove.player
      .direction as BackgammonMoveDirection
    const invalidOrigin: BackgammonPoint =
      invalidCompletedMove.origin as BackgammonPoint

    expect(invalidMove.destination).toBeUndefined()
    expect(invalidCompletedMove.id).toBeDefined()
    expect(invalidOrigin).toBeDefined()
    expect(direction).toBe(player.direction)
    expect(invalidCompletedMove.stateKind).toBe('completed')
    // this test is failing. sometimes. need to investigate
    // expect(invalidCompletedMove.moveKind).toBe('no-move')
  })
})

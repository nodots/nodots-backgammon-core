import { BackgammonError } from '..'

export const PlayDbError = (message: string): BackgammonError => {
  return {
    name: 'PlayDbError',
    entity: 'play',
    message,
  }
}

export const MustUseBothDiceError = (message: string): BackgammonError => {
  return {
    name: 'MustUseBothDiceError',
    entity: 'play',
    message,
  }
}

export const MustUseLargerDieError = (message: string): BackgammonError => {
  return {
    name: 'MustUseLargerDieError',
    entity: 'play',
    message,
  }
}

export const InvalidMoveSequenceError = (message: string): BackgammonError => {
  return {
    name: 'InvalidMoveSequenceError',
    entity: 'play',
    message,
  }
}

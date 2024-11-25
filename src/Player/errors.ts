import { BackgammonError } from '..'

export const PlayerStateError = (message: string): BackgammonError => {
  return {
    name: 'PlayerStateError',
    entity: 'player',
    message,
  }
}

export const PlayerDbError = (message: string): BackgammonError => {
  return {
    name: 'PlayerDbError',
    entity: 'player',
    message,
  }
}

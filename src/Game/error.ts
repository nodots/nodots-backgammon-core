import { BackgammonError } from '..'

export const GameStateError = (message: string): BackgammonError => {
  return {
    name: 'GameStateError',
    entity: 'game',
    message,
  }
}

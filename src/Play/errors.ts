import { BackgammonError } from '..'

export const PlayDbError = (message: string): BackgammonError => {
  return {
    name: 'PlayDbError',
    entity: 'play',
    message,
  }
}

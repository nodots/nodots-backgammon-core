import { NodotsBackgammonError } from '..'

export const PlayDbError = (message: string): NodotsBackgammonError => {
  return {
    name: 'PlayDbError',
    entity: 'play',
    message,
  }
}

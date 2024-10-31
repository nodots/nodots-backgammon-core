import { NodotsBackgammonError } from '..'

export const PlayerStateError = (message: string): NodotsBackgammonError => {
  return {
    name: 'PlayerStateError',
    entity: 'player',
    message,
  }
}

export const PlayerDbError = (message: string): NodotsBackgammonError => {
  return {
    name: 'PlayerDbError',
    entity: 'player',
    message,
  }
}

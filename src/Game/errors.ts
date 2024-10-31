import { NodotsBackgammonError } from '..'

export const GameStateError = (message: string): NodotsBackgammonError => {
  return {
    name: 'GameStateError',
    entity: 'game',
    message,
  }
}

export const GameNotFoundError = (message: string): NodotsBackgammonError => {
  return {
    name: 'GameNotFoundError',
    entity: 'game',
    message,
  }
}

export const GameDbError = (message: string): NodotsBackgammonError => {
  return {
    name: 'GameDbError',
    entity: 'game',
    message,
  }
}

export { v4 as generateId } from 'uuid'
export const randomBoolean = () => (Math.random() > 0.5 ? true : false)

export type NodotsBackgammonEntity =
  | 'board'
  | 'checker'
  | 'cube'
  | 'player'
  | 'play'
  | 'move'
  | 'game'
  | 'offer'

export interface NodotsBackgammonError extends Error {
  entity: NodotsBackgammonEntity
  message: string
}

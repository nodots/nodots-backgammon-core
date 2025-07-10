import { Board, Dice, generateId, Play, Player } from '../dist/index.js'

console.log('--- Verify Move Initialization Edge Case ---')

const bearOffBoardImport = [
  {
    position: { clockwise: 5, counterclockwise: 20 },
    checkers: { qty: 1, color: 'white' },
  },
  {
    position: { clockwise: 4, counterclockwise: 21 },
    checkers: { qty: 14, color: 'white' },
  },
]

const board = Board.initialize(bearOffBoardImport)
const inactiveDice = Dice.initialize('white')
const player = Player.initialize(
  'white',
  'clockwise',
  inactiveDice,
  generateId(),
  'rolling',
  false
)
const rolledPlayer = {
  ...player,
  stateKind: 'rolled',
  dice: { ...inactiveDice, stateKind: 'rolled', currentRoll: [3, 3], total: 6 },
}

const play = Play.initialize(board, rolledPlayer)
console.log('Moves size:', play.moves.size)
Array.from(play.moves).forEach((m, i) => {
  console.log(
    `Move ${i}: origin kind ${m.origin?.kind}, moveKind ${m.moveKind}, die ${m.dieValue}`
  )
})

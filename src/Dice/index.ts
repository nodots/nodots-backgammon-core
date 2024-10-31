/*
Note: Purposefully not doing anything with the database for dice. 
Rolls matter for the model, dice don't except if we want to allow for things 
like players "bringing their own dice" or roll analytics based on randomization 
algorithms?
*/
import { NodotsDice } from '../../@types'

export const buildDice = (): NodotsDice => {
  return {
    white: {
      kind: 'inactive',
      color: 'white',
      roll: [1, 1],
    },
    black: {
      kind: 'inactive',
      color: 'black',
      roll: [1, 1],
    },
  }
}

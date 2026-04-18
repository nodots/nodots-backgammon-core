import {
  BackgammonGameMoving,
  BackgammonGameMoved,
  BackgammonGameRolling,
  BackgammonGameRollingForStart,
  BackgammonMoveSkeleton,
} from '@nodots/backgammon-types'
import { Board, Game, Player } from '..'
import {
  buildHintContextFromGame,
  configureGnubgHints,
  getDoubleHint,
  getMoveHints as getGnuMoveHints,
  getNormalizedPosition,
  getContainerKind,
  getTakeHint,
  initializeGnubgHints,
} from '@nodots/backgammon-ai'
import { MoveFilterSetting } from '@nodots/gnubg-hints'

type SkillConfig = { name: string; evalPlies: number; moveFilter: MoveFilterSetting }

const GNU_BEGINNER: SkillConfig = {
  name: 'GNU Beginner',
  evalPlies: 1,
  moveFilter: MoveFilterSetting.Narrow,
}

const GNU_ADVANCED: SkillConfig = {
  name: 'GNU Advanced',
  evalPlies: 2,
  moveFilter: MoveFilterSetting.Large,
}

interface DoubleEvent {
  gameNumber: number
  turn: number
  offerBy: 'white' | 'black'
  offerBySkill: string
  action: 'double' | 'redouble'
  response: 'take' | 'drop'
  cubeValue: number
}

function parseArgs(): { games: number; swap: boolean; verbose: boolean } {
  const args = process.argv.slice(2)
  let games = 10
  let swap = false
  let verbose = false
  for (const a of args) {
    if (a.startsWith('--games=')) games = parseInt(a.split('=')[1], 10)
    else if (a === '--swap') swap = true
    else if (a === '--verbose') verbose = true
  }
  return { games, swap, verbose }
}

function checkWin(board: any): 'white' | 'black' | null {
  if (!board || !board.off) return null
  const whiteOff = board.off.clockwise?.checkers?.filter((c: any) => c.color === 'white')?.length || 0
  const blackOff = board.off.counterclockwise?.checkers?.filter((c: any) => c.color === 'black')?.length || 0
  if (whiteOff === 15) return 'white'
  if (blackOff === 15) return 'black'
  return null
}

async function runGame(
  gameNumber: number,
  whiteSkill: SkillConfig,
  blackSkill: SkillConfig,
  verbose: boolean
): Promise<{ winner: 'white' | 'black' | null; doubles: DoubleEvent[] }> {
  const white = Player.initialize('white', 'clockwise', 'rolling-for-start', true)
  const black = Player.initialize('black', 'counterclockwise', 'rolling-for-start', true)
  const players = [white, black] as [typeof white, typeof black]

  let state: any = Game.rollForStart(Game.initialize(players) as BackgammonGameRollingForStart)
  let turn = 0
  const maxTurns = 500
  const doubles: DoubleEvent[] = []

  while (turn < maxTurns) {
    turn++

    if (state.stateKind === 'rolling') {
      const activeColor = state.activeColor as 'white' | 'black'
      const skill = activeColor === 'white' ? whiteSkill : blackSkill
      const opponentSkill = activeColor === 'white' ? blackSkill : whiteSkill

      if (Game.canOfferDouble(state as BackgammonGameRolling, state.activePlayer)) {
        await configureGnubgHints({
          evalPlies: skill.evalPlies,
          moveFilter: skill.moveFilter,
          usePruning: true,
        })
        const { request } = buildHintContextFromGame(state, { defaultDice: [0, 0] })
        const doubleHint = await getDoubleHint(request)

        if (doubleHint?.action === 'double' || doubleHint?.action === 'redouble') {
          let doubled = Game.double(state as BackgammonGameRolling)

          // Opponent take/drop decision
          const opponent = doubled.players.find((p: any) => p.color !== activeColor)
          if (!opponent) throw new Error('Opponent not found for double decision')

          await configureGnubgHints({
            evalPlies: opponentSkill.evalPlies,
            moveFilter: opponentSkill.moveFilter,
            usePruning: true,
          })
          const { request: takeReq } = buildHintContextFromGame(doubled as any, {
            activePlayerColor: opponent.color,
            activePlayerDirection: opponent.direction,
            defaultDice: [0, 0],
          })
          const takeHint = await getTakeHint(takeReq)

          const take =
            takeHint?.action === 'take' ||
            (typeof takeHint?.takeEquity === 'number' &&
              typeof takeHint?.dropEquity === 'number' &&
              takeHint.takeEquity > takeHint.dropEquity)

          const cubeValue = (doubled as any).cube?.value ?? 2
          doubles.push({
            gameNumber,
            turn,
            offerBy: activeColor,
            offerBySkill: skill.name,
            action: doubleHint.action,
            response: take ? 'take' : 'drop',
            cubeValue,
          })

          if (take) {
            state = Game.acceptDouble(doubled as any, opponent as any)
          } else {
            state = Game.refuseDouble(doubled as any, opponent as any)
          }

          if (state.stateKind === 'completed') {
            if (verbose) {
              console.log(`Game ${gameNumber}: ${activeColor} offered ${cubeValue}, opponent ${take ? 'took' : 'dropped'}`)
            }
            break
          }
        }
      }
    }

    const rolled = Game.roll(state)
    let moving: BackgammonGameMoving | BackgammonGameMoved = rolled
    const rollTuple = rolled.activePlayer.dice.currentRoll as [number, number]
    const isWhiteTurn = rolled.activeColor === 'white'
    const currentSkill = isWhiteTurn ? whiteSkill : blackSkill

    await configureGnubgHints({
      evalPlies: currentSkill.evalPlies,
      moveFilter: currentSkill.moveFilter,
      usePruning: true,
    })

    const { request } = buildHintContextFromGame(rolled as any)
    request.dice = [rollTuple[0], rollTuple[1]]

    const hints = await getGnuMoveHints(request, 1)
    const altReq = { ...request, dice: [rollTuple[1], rollTuple[0]] as [number, number] }
    const altHints = (!hints || hints.length === 0 || !hints[0].moves?.length)
      ? await getGnuMoveHints(altReq, 1)
      : await getGnuMoveHints(altReq, 1).catch(() => [])

    let hintSeq = (hints && hints[0] && Array.isArray(hints[0].moves)) ? hints[0].moves : []
    const hintSeqAlt = (altHints && altHints[0] && Array.isArray(altHints[0].moves)) ? altHints[0].moves : []
    let stepIndex = 0

    while (moving.stateKind === 'moving') {
      const readyMoves = Array.from(moving.activePlay.moves).filter(
        (m: any) => m.stateKind === 'ready' || (m.stateKind === 'in-progress' && !m.origin)
      )
      if (readyMoves.length === 0) break

      let chosenDie: number | undefined
      let selectedOrigin: any
      let possibleMoves: BackgammonMoveSkeleton[] = []
      const direction = (moving.activePlayer as any).direction as 'clockwise' | 'counterclockwise'

      const tryMap = (target: any) => {
        for (const m of readyMoves) {
          const dv = (m as any).dieValue as number
          const pm = Board.getPossibleMoves(
            (moving as any).board,
            (moving as any).activePlay.player,
            dv as any
          ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
          const arr = Array.isArray(pm) ? pm : pm.moves
          for (const mv of arr) {
            const fromKind = getContainerKind(mv.origin as any)
            const toKind = getContainerKind(mv.destination as any)
            const from = getNormalizedPosition(mv.origin as any, direction)
            const to = getNormalizedPosition(mv.destination as any, direction)
            if (from === null || to === null) continue
            if (
              target.from === from &&
              target.to === to &&
              target.fromContainer === fromKind &&
              target.toContainer === toKind
            ) {
              chosenDie = dv
              selectedOrigin = (mv as any).origin
              possibleMoves = arr
              return true
            }
          }
        }
        return false
      }

      const target = (stepIndex < hintSeq.length) ? hintSeq[stepIndex] : undefined
      if (target) {
        if (!tryMap(target) && stepIndex === 0 && hintSeqAlt.length > 0) {
          const altTarget = hintSeqAlt[0]
          if (tryMap(altTarget)) {
            hintSeq = hintSeqAlt
          }
        }
      }

      if (!chosenDie) {
        const m = readyMoves[0] as any
        const pm = Board.getPossibleMoves(
          (moving as any).board,
          (moving as any).activePlay.player,
          (m as any).dieValue as any
        ) as BackgammonMoveSkeleton[] | { moves: BackgammonMoveSkeleton[] }
        const arr = Array.isArray(pm) ? pm : pm.moves
        if (arr.length > 0) {
          chosenDie = (m as any).dieValue
          possibleMoves = arr
          selectedOrigin = (arr[0] as any).origin
        }
      }

      if (!chosenDie || !selectedOrigin || possibleMoves.length === 0) break
      const originChecker = (selectedOrigin as any).checkers.find(
        (c: any) => c.color === (moving as any).activeColor
      )
      if (!originChecker) break
      const moved = Game.move(moving as BackgammonGameMoving, originChecker.id)
      if ((moved as any).stateKind === 'moved') {
        moving = moved as BackgammonGameMoved
        break
      } else if ('board' in moved) {
        moving = moved as BackgammonGameMoving
      } else {
        break
      }
      if (target && chosenDie) stepIndex++
    }

    if (moving.stateKind === 'moving') {
      moving = Game.checkAndCompleteTurn(moving as BackgammonGameMoving) as any
    }

    const wByOff = checkWin((moving as any).board || rolled.board)
    if (wByOff) {
      state = moving
      break
    }

    if ((moving as any).stateKind === 'moved') {
      state = Game.confirmTurn(moving as BackgammonGameMoved)
    } else {
      state = moving
    }
  }

  const winner = checkWin(state.board) ?? (state.stateKind === 'completed' ? state.winner?.color : null)
  return { winner, doubles }
}

async function run(): Promise<void> {
  const { games, swap, verbose } = parseArgs()
  await initializeGnubgHints()

  const allDoubles: DoubleEvent[] = []
  let advWins = 0
  let begWins = 0

  for (let i = 1; i <= games; i++) {
    const swapColors = swap && i % 2 === 0
    const whiteSkill = swapColors ? GNU_BEGINNER : GNU_ADVANCED
    const blackSkill = swapColors ? GNU_ADVANCED : GNU_BEGINNER

    const res = await runGame(i, whiteSkill, blackSkill, verbose)
    allDoubles.push(...res.doubles)
    const winnerSkill = res.winner === 'white' ? whiteSkill : res.winner === 'black' ? blackSkill : null
    if (winnerSkill?.name === GNU_ADVANCED.name) advWins++
    if (winnerSkill?.name === GNU_BEGINNER.name) begWins++
  }

  console.log(`\nGNU Advanced vs GNU Beginner (${games} games)`)
  console.log(`Advanced wins: ${advWins}`)
  console.log(`Beginner wins: ${begWins}`)
  console.log(`Total doubles: ${allDoubles.length}`)

  for (const d of allDoubles) {
    console.log(
      `Game ${d.gameNumber} Turn ${d.turn}: ${d.offerBy} (${d.offerBySkill}) ${d.action} -> ${d.response} @ ${d.cubeValue}`
    )
  }
}

if (require.main === module) {
  run().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

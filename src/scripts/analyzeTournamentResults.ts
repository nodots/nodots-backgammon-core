/**
 * Tournament Results Analyzer
 *
 * Analyzes tournament results and generates calibration recommendations.
 * Can automatically update seed-robots.ts with measured PR values.
 *
 * Usage:
 *   npm run tournament:analyze -- --input=tournament-results/calibration-*.json
 *   npm run tournament:analyze -- --input=tournament-results/calibration-*.json --auto-update
 */

import * as fs from 'fs'
import * as path from 'path'
import { GNU_OFFICIAL_THRESHOLDS, GNU_ROBOTS } from './runRobotTournament'

interface TournamentData {
  tournamentId: string
  timestamp: string
  config: { games: number; matchupsCount: number }
  officialThresholds: typeof GNU_OFFICIAL_THRESHOLDS
  matchups: Array<{
    robot1: { name: string; evalPlies: number; expectedPR: number }
    robot2: { name: string; evalPlies: number; expectedPR: number }
    robot1Stats: { wins: number; meanPR: number; medianPR: number; stdDevPR: number }
    robot2Stats: { wins: number; meanPR: number; medianPR: number; stdDevPR: number }
  }>
}

interface AnalysisConfig {
  inputFile: string
  autoUpdate: boolean
  verbose: boolean
}

function parseArgs(): AnalysisConfig {
  const args = process.argv.slice(2)
  let inputFile = ''
  let autoUpdate = false
  let verbose = false

  for (const a of args) {
    if (a.startsWith('--input=')) inputFile = a.split('=')[1]
    else if (a === '--auto-update') autoUpdate = true
    else if (a === '--verbose') verbose = true
  }

  return { inputFile, autoUpdate, verbose }
}

function findLatestTournamentFile(dir: string): string | null {
  if (!fs.existsSync(dir)) return null

  const files = fs.readdirSync(dir)
    .filter(f => f.startsWith('calibration-') && f.endsWith('.json'))
    .sort()
    .reverse()

  return files.length > 0 ? path.join(dir, files[0]) : null
}

function getSkillLevelFromPR(pr: number): string {
  if (pr <= 2) return 'Supernatural'
  if (pr <= 5) return 'World Class'
  if (pr <= 8) return 'Expert'
  if (pr <= 12) return 'Advanced'
  if (pr <= 18) return 'Intermediate'
  if (pr <= 26) return 'Casual Player'
  if (pr <= 35) return 'Beginner'
  return 'Awful'
}

function aggregateRobotPRs(data: TournamentData): Map<string, { prValues: number[]; expectedPR: number }> {
  const robotData = new Map<string, { prValues: number[]; expectedPR: number }>()

  for (const matchup of data.matchups) {
    // Robot 1
    const r1Data = robotData.get(matchup.robot1.name) || { prValues: [], expectedPR: matchup.robot1.expectedPR }
    r1Data.prValues.push(matchup.robot1Stats.meanPR)
    robotData.set(matchup.robot1.name, r1Data)

    // Robot 2
    const r2Data = robotData.get(matchup.robot2.name) || { prValues: [], expectedPR: matchup.robot2.expectedPR }
    r2Data.prValues.push(matchup.robot2Stats.meanPR)
    robotData.set(matchup.robot2.name, r2Data)
  }

  return robotData
}

function calculateCalibrationFactor(robotData: Map<string, { prValues: number[]; expectedPR: number }>): number {
  // Calculate overall calibration factor based on how measured PRs compare to expected
  const factors: number[] = []

  for (const [, data] of Array.from(robotData.entries())) {
    if (data.prValues.length === 0) continue
    const measuredPR = data.prValues.reduce((a, b) => a + b, 0) / data.prValues.length
    if (measuredPR > 0 && data.expectedPR > 0) {
      factors.push(data.expectedPR / measuredPR)
    }
  }

  if (factors.length === 0) return 1

  // Use median factor for robustness
  factors.sort((a, b) => a - b)
  const mid = Math.floor(factors.length / 2)
  return factors.length % 2 === 0 ? (factors[mid - 1] + factors[mid]) / 2 : factors[mid]
}

async function updateSeedRobots(
  robotData: Map<string, { prValues: number[]; expectedPR: number }>,
  verbose: boolean
): Promise<void> {
  const seedRobotsPath = path.resolve(__dirname, '../../api/src/utils/seed-robots.ts')

  if (!fs.existsSync(seedRobotsPath)) {
    console.log(`  Warning: seed-robots.ts not found at ${seedRobotsPath}`)
    console.log('  Looking in packages/api...')

    // Try alternate path
    const altPath = path.resolve(process.cwd(), '../api/src/utils/seed-robots.ts')
    if (!fs.existsSync(altPath)) {
      console.error('  Could not find seed-robots.ts')
      return
    }
  }

  let content = fs.readFileSync(seedRobotsPath, 'utf-8')
  let updated = false

  for (const [robotName, data] of Array.from(robotData.entries())) {
    if (data.prValues.length === 0) continue
    const measuredPR = data.prValues.reduce((a, b) => a + b, 0) / data.prValues.length

    // Find and replace averagePR for this robot
    // Pattern: averagePR: 'X.XX', within the robot config block
    const robotNameEscaped = robotName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Look for the robot's config block and update averagePR
    const blockRegex = new RegExp(
      `(nickname: '${robotNameEscaped}'[\\s\\S]*?averagePR: ')[\\d.]+(')`
    )

    if (blockRegex.test(content)) {
      const newPR = measuredPR.toFixed(2)
      content = content.replace(blockRegex, `$1${newPR}$2`)
      updated = true
      if (verbose) {
        console.log(`  Updated ${robotName}: averagePR = ${newPR}`)
      }
    }
  }

  if (updated) {
    fs.writeFileSync(seedRobotsPath, content)
    console.log(`\nUpdated seed-robots.ts with measured PR values`)
  } else {
    console.log('\nNo updates needed for seed-robots.ts')
  }
}

async function updatePerformanceRatingCalculator(): Promise<void> {
  const calcPath = path.resolve(__dirname, '../Services/PerformanceRatingCalculator.ts')

  if (!fs.existsSync(calcPath)) {
    console.error('Could not find PerformanceRatingCalculator.ts')
    return
  }

  let content = fs.readFileSync(calcPath, 'utf-8')

  // Update getSkillLevel thresholds to match official GNU
  const oldThresholds = `static getSkillLevel(pr: number): string {
    if (pr <= 2.5) return 'World Class'
    if (pr <= 5) return 'Expert'
    if (pr <= 7.5) return 'Advanced'
    if (pr <= 12.5) return 'Intermediate'
    if (pr <= 17.5) return 'Casual'
    return 'Beginner'
  }`

  const newThresholds = `static getSkillLevel(pr: number): string {
    // Official GNU Backgammon thresholds (equity * 1000)
    if (pr <= 2) return 'Supernatural'
    if (pr <= 5) return 'World Class'
    if (pr <= 8) return 'Expert'
    if (pr <= 12) return 'Advanced'
    if (pr <= 18) return 'Intermediate'
    if (pr <= 26) return 'Casual Player'
    if (pr <= 35) return 'Beginner'
    return 'Awful'
  }`

  if (content.includes('if (pr <= 2.5)')) {
    content = content.replace(oldThresholds, newThresholds)
    fs.writeFileSync(calcPath, content)
    console.log('Updated PerformanceRatingCalculator.ts with official GNU thresholds')
  } else if (content.includes('if (pr <= 2)')) {
    console.log('PerformanceRatingCalculator.ts already has official GNU thresholds')
  } else {
    console.log('Could not find skill level thresholds in PerformanceRatingCalculator.ts')
  }

  // Check if PR multiplier needs updating
  if (content.includes('averageEquityLoss * 100')) {
    console.log('\nNote: PR formula uses * 100 multiplier')
    console.log('Official GNU uses * 1000 (equity loss as millipoints)')
    console.log('Consider updating if measured PRs are 10x lower than expected')
  }
}

async function main() {
  const config = parseArgs()
  let { inputFile, autoUpdate, verbose } = config

  // Find input file if not specified
  if (!inputFile) {
    const defaultDir = path.resolve(process.cwd(), 'tournament-results')
    inputFile = findLatestTournamentFile(defaultDir) || ''
  }

  if (!inputFile || !fs.existsSync(inputFile)) {
    console.error('No tournament results file found.')
    console.error('Run a tournament first: npm run tournament:run')
    console.error('Or specify a file: npm run tournament:analyze -- --input=path/to/results.json')
    process.exit(1)
  }

  console.log(`\n=== Tournament Analysis ===`)
  console.log(`Input file: ${inputFile}`)

  const data: TournamentData = JSON.parse(fs.readFileSync(inputFile, 'utf-8'))

  console.log(`Tournament ID: ${data.tournamentId}`)
  console.log(`Timestamp: ${data.timestamp}`)
  console.log(`Games per matchup: ${data.config.games}`)
  console.log(`Total matchups: ${data.matchups.length}`)

  // Aggregate robot PRs
  const robotData = aggregateRobotPRs(data)

  console.log('\n=== Measured PRs by Robot ===')
  console.log('Robot                  | Measured PR | Expected PR | Diff    | Skill Level (GNU)')
  console.log('-----------------------|-------------|-------------|---------|------------------')

  const sortedRobots = Array.from(robotData.entries()).sort((a, b) => {
    const robotA = GNU_ROBOTS.find(r => r.name === a[0])
    const robotB = GNU_ROBOTS.find(r => r.name === b[0])
    return (robotA?.evalPlies ?? 0) - (robotB?.evalPlies ?? 0)
  })

  for (const [robotName, data] of sortedRobots) {
    const measuredPR = data.prValues.reduce((a, b) => a + b, 0) / data.prValues.length
    const diff = measuredPR - data.expectedPR
    const skillLevel = getSkillLevelFromPR(measuredPR)
    const diffStr = diff > 0 ? `+${diff.toFixed(2)}` : diff.toFixed(2)

    console.log(
      `${robotName.padEnd(22)} | ${measuredPR.toFixed(2).padStart(11)} | ${data.expectedPR.toFixed(2).padStart(11)} | ${diffStr.padStart(7)} | ${skillLevel}`
    )
  }

  // Calculate calibration factor
  const calibrationFactor = calculateCalibrationFactor(robotData)
  console.log(`\n=== Calibration Analysis ===`)
  console.log(`Calibration factor: ${calibrationFactor.toFixed(3)}`)

  if (calibrationFactor < 0.5) {
    console.log('Measured PRs are significantly HIGHER than expected.')
    console.log('Consider DECREASING the PR multiplier (e.g., * 100 -> * 50)')
  } else if (calibrationFactor > 2.0) {
    console.log('Measured PRs are significantly LOWER than expected.')
    console.log('Consider INCREASING the PR multiplier (e.g., * 100 -> * 500 or * 1000)')
  } else if (Math.abs(calibrationFactor - 1.0) < 0.2) {
    console.log('Measured PRs are close to expected. Current calibration is good.')
  } else {
    console.log(`Adjustment needed: multiply current PR formula by ${calibrationFactor.toFixed(2)}`)
  }

  // Compare against official GNU thresholds
  console.log('\n=== Official GNU Threshold Comparison ===')
  for (const [robotName, robotStats] of sortedRobots) {
    const measuredPR = robotStats.prValues.reduce((a, b) => a + b, 0) / robotStats.prValues.length
    const skillLevel = getSkillLevelFromPR(measuredPR)
    const robot = GNU_ROBOTS.find(r => r.name === robotName)

    // Expected skill level based on robot name
    let expectedLevel = 'Unknown'
    if (robotName.includes('Grandmaster')) expectedLevel = 'Supernatural'
    else if (robotName.includes('World Class')) expectedLevel = 'World Class'
    else if (robotName.includes('Expert')) expectedLevel = 'Expert'
    else if (robotName.includes('Advanced')) expectedLevel = 'Advanced'
    else if (robotName.includes('Intermediate')) expectedLevel = 'Intermediate'
    else if (robotName.includes('Beginner')) expectedLevel = 'Casual Player'
    else if (robotName.includes('Novice')) expectedLevel = 'Beginner'

    const match = skillLevel === expectedLevel ? 'OK' : 'MISMATCH'
    console.log(`${robotName}: measured=${skillLevel}, expected=${expectedLevel} [${match}]`)
  }

  // Auto-update if requested
  if (autoUpdate) {
    console.log('\n=== Auto-Update ===')
    await updateSeedRobots(robotData, verbose)
    await updatePerformanceRatingCalculator()
  } else {
    console.log('\nTo auto-update seed-robots.ts with measured values, run:')
    console.log(`  npm run tournament:analyze -- --input=${inputFile} --auto-update`)
  }

  // Generate recommendations
  console.log('\n=== Recommendations ===')
  console.log('1. Run more games for statistical significance (suggest 500+ per matchup)')
  console.log('2. Update PerformanceRatingCalculator.ts thresholds to match official GNU')
  console.log('3. Consider adjusting PR multiplier based on calibration factor')
  console.log('4. Re-run validation tournament after updates')
}

if (require.main === module) {
  main().catch((err) => {
    console.error('Analysis failed:', err)
    process.exit(1)
  })
}

export { main as analyzeTournamentResults }

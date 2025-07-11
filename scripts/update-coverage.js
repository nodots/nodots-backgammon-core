#!/usr/bin/env node

const { exec } = require('child_process')
const fs = require('fs')
const path = require('path')

function getColorForCoverage(percentage) {
  const num = parseFloat(percentage)
  if (num >= 90) return 'brightgreen'
  if (num >= 80) return 'green'
  if (num >= 70) return 'yellow'
  if (num >= 60) return 'orange'
  return 'red'
}

function runCoverageAndParseOutput() {
  return new Promise((resolve, reject) => {
    // Run the coverage command and capture output
    exec('npm run test:coverage', {
      encoding: 'utf8',
      cwd: path.resolve(__dirname, '..'),
      maxBuffer: 1024 * 1024 * 20, // 20MB buffer to prevent ENOBUFS errors
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Error running coverage:', error)
        resolve(null)
        return
      }

      try {
        // Extract just the "All files" summary line
        const lines = stdout.split('\n')
        let summaryLine = null

        // Find the "All files" summary line
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('All files') && lines[i].includes('|')) {
            summaryLine = lines[i]
            break
          }
        }

        if (!summaryLine) {
          throw new Error('Could not find coverage summary line in output')
        }

        // Parse the summary line to extract percentages
        const parts = summaryLine.split('|').map((part) => part.trim())
        if (parts.length >= 5) {
          const statements = Math.round(parseFloat(parts[1]))
          const branches = Math.round(parseFloat(parts[2]))
          const functions = Math.round(parseFloat(parts[3]))
          const lines = Math.round(parseFloat(parts[4]))

          // Create coverage badges
          const badges = [
            `![Statements](https://img.shields.io/badge/Statements-${statements}%25-${getColorForCoverage(
              statements
            )}?style=flat-square)`,
            `![Branches](https://img.shields.io/badge/Branches-${branches}%25-${getColorForCoverage(
              branches
            )}?style=flat-square)`,
            `![Functions](https://img.shields.io/badge/Functions-${functions}%25-${getColorForCoverage(
              functions
            )}?style=flat-square)`,
            `![Lines](https://img.shields.io/badge/Lines-${lines}%25-${getColorForCoverage(
              lines
            )}?style=flat-square)`,
          ]

          resolve(badges.join('\n'))
        } else {
          throw new Error('Could not parse coverage summary line')
        }
      } catch (parseError) {
        console.error('Error parsing coverage output:', parseError.message)
        resolve(null)
      }
    })
  })
}

function updateReadme(coverageTable) {
  const readmePath = path.resolve(__dirname, '../README.md')
  let content = fs.readFileSync(readmePath, 'utf8')

  // Define markers for the coverage section
  const startMarker = '<!-- COVERAGE-START -->'
  const endMarker = '<!-- COVERAGE-END -->'

  const startIndex = content.indexOf(startMarker)
  const endIndex = content.indexOf(endMarker)

  if (startIndex === -1 || endIndex === -1) {
    // If markers don't exist, add them before the first heading after the badges
    const lines = content.split('\n')
    let insertIndex = -1

    // Find the line after the badges and before the first content
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith('Core game logic implementation')) {
        insertIndex = i
        break
      }
    }

    if (insertIndex === -1) {
      // Fallback: add after the last badge line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('[![') && !lines[i + 1]?.includes('[![')) {
          insertIndex = i + 2
          break
        }
      }
    }

    if (insertIndex !== -1) {
      const coverageSection = [
        '',
        '## Test Coverage',
        '',
        startMarker,
        coverageTable,
        endMarker,
        '',
      ]

      lines.splice(insertIndex, 0, ...coverageSection)
      content = lines.join('\n')
    }
  } else {
    // Replace existing coverage section
    const before = content.substring(0, startIndex + startMarker.length)
    const after = content.substring(endIndex)
    content = before + '\n' + coverageTable + '\n' + after
  }

  fs.writeFileSync(readmePath, content)
  console.log('README.md updated with latest coverage information')
}

// Main execution
async function main() {
  const coverageTable = await runCoverageAndParseOutput()
  if (coverageTable) {
    updateReadme(coverageTable)
  } else {
    console.error('Failed to generate coverage table')
    process.exit(1)
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error)
  process.exit(1)
})

#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

function getColorForCoverage(percentage) {
  const num = parseFloat(percentage);
  if (num >= 90) return 'brightgreen';
  if (num >= 80) return 'green';
  if (num >= 70) return 'yellow';
  if (num >= 60) return 'orange';
  return 'red';
}

function runCoverageAndParseOutputAsync(callback) {
  exec(
    'npm run test:coverage',
    {
      cwd: path.resolve(__dirname, '..'),
      maxBuffer: 1024 * 1024 * 10 // 10MB buffer
    },
    (error, stdout, stderr) => {
      if (error) {
        console.error('Error running coverage:', error.message);
        callback(null);
        return;
      }

      const lines = stdout.split('\n');
      let summaryLine = null;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('All files') && lines[i].includes('|')) {
          summaryLine = lines[i];
          break;
        }
      }
      if (!summaryLine) {
        console.error('Could not find coverage summary line in output');
        callback(null);
        return;
      }
      const parts = summaryLine.split('|').map((part) => part.trim());
      if (parts.length >= 5) {
        const statements = Math.round(parseFloat(parts[1]));
        const branches = Math.round(parseFloat(parts[2]));
        const functions = Math.round(parseFloat(parts[3]));
        const linesPct = Math.round(parseFloat(parts[4]));
        const badges = [
          `![Statements](https://img.shields.io/badge/Statements-${statements}%25-${getColorForCoverage(statements)}?style=flat-square)`,
          `![Branches](https://img.shields.io/badge/Branches-${branches}%25-${getColorForCoverage(branches)}?style=flat-square)`,
          `![Functions](https://img.shields.io/badge/Functions-${functions}%25-${getColorForCoverage(functions)}?style=flat-square)`,
          `![Lines](https://img.shields.io/badge/Lines-${linesPct}%25-${getColorForCoverage(linesPct)}?style=flat-square)`,
        ];
        callback(badges.join('\n'));
      } else {
        console.error('Could not parse coverage summary line');
        callback(null);
      }
    }
  );
}

function updateReadme(coverageTable) {
  const readmePath = path.resolve(__dirname, '../README.md');
  let content*

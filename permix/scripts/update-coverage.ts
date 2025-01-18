import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { total } from '../coverage/coverage-summary.json'

const currentDir = path.dirname(fileURLToPath(import.meta.url))
const readmePath = path.join(currentDir, '../..', 'README.md')
const coveragePercentage = total.lines.pct.toFixed(2)
const readme = fs.readFileSync(readmePath, 'utf8')

const regex = /Coverage-(\d+\.\d+|\d{2,})%25-/
const replacement = `Coverage-${coveragePercentage}%25-`

fs.writeFileSync(readmePath, readme.replace(regex, replacement))

#!/usr/bin/env node
// dsh-ui-cell CLI 入口。
import { runCli } from './add.ts'

process.exit(runCli(process.argv.slice(2)))

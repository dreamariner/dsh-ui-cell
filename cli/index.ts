#!/usr/bin/env node
// dsh-ui-kit CLI 入口。
import { runCli } from './add.ts'

process.exit(runCli(process.argv.slice(2)))

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { createServer } from 'vite'

// const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isTest = process.env.VITEST

process.env.MY_CUSTOM_SECRET = 'API_KEY_qwertyuiop'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

;(async () => {
  const server = await createServer({
    // any valid user config options, plus `mode` and `configFile`
    configFile: "vite.config.js",
    root: __dirname,
    server: {
      port: 1337,
    },
  })
  await server.listen()

  server.printUrls()
})()

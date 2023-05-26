import fs from 'node:fs'
import path from 'node:path'
// import crypto from "crypto";
import { fileURLToPath } from 'node:url'
import express from 'express'

// const __dirname = path.dirname(fileURLToPath(import.meta.url))

const isTest = process.env.VITEST

process.env.MY_CUSTOM_SECRET = 'API_KEY_qwertyuiop'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export async function createServer(
  root = process.cwd(),
  isProd = process.env.NODE_ENV === 'production',
  hmrPort,
) {
  const resolve = (p) => path.resolve(__dirname, p)

  const indexProd = isProd
    ? fs.readFileSync(resolve('dist/client/index.html'), 'utf-8')
    : ''

  const app = express()

  /**
   * @type {import('vite').ViteDevServer}
   */
  let vite
  if (!isProd) {
    vite = await (
      await import('vite')
    ).createServer({
      // root,
      // logLevel: isTest ? 'error' : 'info',
      configFile: 'vite.config.js',
      server: {
        root: __dirname,
        middlewareMode: true,
          port: 1337,
        /* watch: {
          // During tests we edit the files too fast and sometimes chokidar
          // misses change events, so enforce polling for consistency
          usePolling: true,
          interval: 100,
        },
        hmr: {
          port: hmrPort,
        }, */
      },
      appType: 'custom',
    })
    // use vite's connect instance as middleware
    app.use(vite.middlewares)
  } else {
    app.use((await import('compression')).default())
    app.use(
      (await import('serve-static')).default(resolve('dist/client'), {
        index: false,
      }),
    )
  }

  let render;
  // @NOTE: Moving ssrLoadModule here fixes the issue
  // render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
  app.use('*', async (req, res) => {
    try {
      const url = req.originalUrl

      let template
      if (!isProd) {
        // always read fresh template in dev
        template = fs.readFileSync(resolve('index.html'), 'utf-8')
        template = await vite.transformIndexHtml(url, template)

        // @NOTE: If ssrLoadModule is called here after the first time it causes
        // Linaria CSS to be removed when hot module update occurs
        render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
        // console.log("Render MD5");
        const renderFn = render.toString();
        // console.log(crypto.createHash("md5").update(renderFn).digest("hex"));
      } else {
        template = indexProd
        // @ts-ignore
        render = (await import('./dist/server/entry-server.js')).render
      }

      const context = {}
      const appHtml = render(url, context)

      if (context.url) {
        // Somewhere a `<Redirect>` was rendered
        return res.redirect(301, context.url)
      }

      const html = template.replace(`<!--app-html-->`, appHtml)
      // console.log("HTML MD5");
      // console.log(crypto.createHash("md5").update(html).digest("hex"));

      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      !isProd && vite.ssrFixStacktrace(e)
      console.log(e.stack)
      res.status(500).end(e.stack)
    }
  })

  return { app, vite }
}

if (!isTest) {
  createServer().then(({ app }) =>
    app.listen(1337, () => {
      console.log('http://localhost:5173')
    }),
  )
}

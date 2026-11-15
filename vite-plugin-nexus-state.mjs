import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'

// Persiste o estado da interface em um arquivo JSON local, servido pelo próprio Vite
// (dev e preview). GET lê o arquivo; PUT/POST grava o estado mais recente.

export const STATE_ENDPOINT = '/__nexus/state'

export function nexusState({ file = '.nexus/ui-state.json' } = {}) {
  let path = file
  let queue = Promise.resolve()

  const save = (body) => {
    // Grava em arquivo temporário e renomeia: um salvamento interrompido não corrompe o estado.
    queue = queue.then(async () => {
      await mkdir(dirname(path), { recursive: true })
      await writeFile(`${path}.tmp`, body, 'utf8')
      await rename(`${path}.tmp`, path)
    })
    return queue
  }

  const middleware = (req, res, next) => {
    if (req.url?.split('?')[0] !== STATE_ENDPOINT) return next()
    if (req.method === 'GET') {
      readFile(path, 'utf8')
        .then((text) => {
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        })
        .catch(() => {
          res.statusCode = 204
          res.end()
        })
      return
    }
    if (req.method === 'PUT' || req.method === 'POST') {
      let body = ''
      req.setEncoding('utf8')
      req.on('data', (chunk) => (body += chunk))
      req.on('end', () => {
        try {
          JSON.parse(body)
        } catch {
          res.statusCode = 400
          return res.end()
        }
        save(body)
          .then(() => {
            res.statusCode = 204
            res.end()
          })
          .catch((err) => {
            res.statusCode = 500
            res.end(String(err))
          })
      })
      return
    }
    res.statusCode = 405
    res.end()
  }

  return {
    name: 'nexus-state',
    configResolved(config) {
      path = resolve(config.root, file)
    },
    config: () => ({ server: { watch: { ignored: [`**/${file}`, `**/${file}.tmp`] } } }),
    configureServer: (server) => void server.middlewares.use(middleware),
    configurePreviewServer: (server) => void server.middlewares.use(middleware),
  }
}

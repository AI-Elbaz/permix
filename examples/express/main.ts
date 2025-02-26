import type { PermixDefinition } from 'permix'
import express from 'express'
import { createPermix } from 'permix/express'

const app = express()

type Definition = PermixDefinition<{
  user: {
    action: 'read' | 'write'
  }
}>

declare global {
  interface PermixExpressDefinition extends Definition {}
}

const { permixMiddleware, getPermix, checkMiddleware } = createPermix<Definition>({
  onUnauthorized: ({ res }) => res.status(403).json({ error: 'You are not authorized to access this resource' }),
})

app.use(permixMiddleware)

app.use((req, res, next) => {
  const permix = getPermix(req)

  // Here you can check the request headers to get the user id and setup normal user permissions
  permix.setup({
    user: {
      read: true,
      write: false,
    },
  })

  next()
})

const router = express.Router()

router.get('/', checkMiddleware('user', 'read'), (req, res) => {
  res.send('Hello World')
})

router.get('/write', checkMiddleware('user', 'write'), (req, res) => {
  res.send('Hello World')
})

app.use(router)

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Server is running on port 3000')
})

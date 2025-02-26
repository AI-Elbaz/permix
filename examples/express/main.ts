import type { PermixDefinition } from 'permix'
import express from 'express'
import { createPermixExpress } from 'permix/express'

const app = express()

type Definition = PermixDefinition<{
  user: {
    action: 'read' | 'write'
  }
}>

const { setupPermixMiddleware, checkMiddleware } = createPermixExpress<Definition>({
  onUnauthorized: ({ res }) => res.status(403).json({ error: 'You are not authorized to access this resource' }),
})

app.use(setupPermixMiddleware(() => ({
  user: {
    read: true,
    write: false,
  },
})))

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

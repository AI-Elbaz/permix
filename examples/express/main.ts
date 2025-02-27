import type { PermixDefinition } from 'permix'
import express from 'express'
import { createPermix } from 'permix/express'

const app = express()

type PermissionsDefinition = PermixDefinition<{
  user: {
    action: 'read' | 'write'
  }
}>

const permix = createPermix<PermissionsDefinition>({
  onForbidden: ({ res }) => res.status(403).json({ error: 'You do not have permission to access this resource' }),
})

app.use(permix.setupMiddleware(() => ({
  user: {
    read: true,
    write: false,
  },
})))

const router = express.Router()

router.get('/', permix.checkMiddleware('user', 'read'), (req, res) => {
  res.send('Hello World')
})

router.get('/write', permix.checkMiddleware('user', 'write'), (req, res) => {
  res.send('Hello World')
})

router.get('/permix', (req, res) => {
  res.json({ canRead: permix.get(req).check('user', 'read') })
})

app.use(router)

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Server is running on port 3000')
})

import express from 'express'
import { createPermix } from 'permix'
import { createPermixMiddleware } from 'permix/express'

const app = express()

const permix = createPermix<{
  user: {
    action: 'read' | 'write'
  }
}>()

const { check } = createPermixMiddleware(permix, {
  onUnauthorized: ({ res }) => res.status(403).json({ error: 'You are not authorized to access this resource' }),
})

app.use((req, res, next) => {
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

router.get('/', check('user', 'read'), (req, res) => {
  res.send('Hello World')
})

router.get('/write', check('user', 'write'), (req, res) => {
  res.send('Hello World')
})

app.use(router)

app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Server is running on port 3000')
})

import type { PermixDefinition } from '../core/createPermix'
import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createPermix } from './createPermix'

interface Post {
  id: string
  authorId: string
}

type Definition = PermixDefinition<{
  post: {
    dataType: Post
    action: 'create' | 'read' | 'update'
  }
  user: {
    action: 'delete'
  }
}>

describe('createPermix', () => {
  const { permixMiddleware, getPermix, checkMiddleware } = createPermix<Definition>()

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    expect(() => checkMiddleware('post', 'delete')()).toThrow()
  })

  it('should allow access when permission is granted', async () => {
    const app = express()

    app.use(permixMiddleware)

    app.use((req, res, next) => {
      const permix = getPermix(req)

      permix.setup({
        post: {
          create: true,
          read: false,
          update: false,
        },
        user: {
          delete: false,
        },
      })
      next()
    })

    app.post('/posts', checkMiddleware('post', 'create'), (_, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true })
  })

  // it('should deny access when permission is not granted', async () => {
  //   const app = express()

  //   app.use('*', (req, res, next) => {
  //     permix.setup({
  //       post: {
  //         create: false,
  //         read: false,
  //         update: false,
  //       },
  //       user: {
  //         delete: false,
  //       },
  //     })
  //     next()
  //   })

  //   app.post('/posts', check('post', 'create'), (_, res) => {
  //     res.json({ success: true })
  //   })

  //   const response = await request(app)
  //     .post('/posts')
  //     .send({ title: 'Test Post' })

  //   expect(response.status).toBe(403)
  //   expect(response.body).toEqual({ error: 'Forbidden' })
  // })

  // it('should work with custom error handler', async () => {
  //   const { check } = createPermixMiddleware(permix, {
  //     onUnauthorized: ({ res }) => res.status(401).json({ error: 'Custom error' }),
  //   })

  //   const app = express()

  //   app.use('*', (req, res, next) => {
  //     permix.setup({
  //       post: {
  //         create: false,
  //         read: false,
  //         update: false,
  //       },
  //       user: {
  //         delete: false,
  //       },
  //     })
  //     next()
  //   })

  //   app.post('/posts', check('post', 'create'), (_, res) => {
  //     res.json({ success: true })
  //   })

  //   const response = await request(app)
  //     .post('/posts')
  //     .send({ title: 'Test Post' })

  //   expect(response.status).toBe(401)
  //   expect(response.body).toEqual({ error: 'Custom error' })
  // })

  // it('should work with custom error and params', async () => {
  //   const { check } = createPermixMiddleware(permix, {
  //     onUnauthorized: ({ res, entity, actions }) => res.status(401).json({ error: `You do not have permission to ${actions.join('/')} a ${entity}` }),
  //   })

  //   const app = express()

  //   app.use('*', (req, res, next) => {
  //     permix.setup({
  //       post: {
  //         create: false,
  //         read: false,
  //         update: false,
  //       },
  //       user: {
  //         delete: false,
  //       },
  //     })
  //     next()
  //   })

  //   app.post('/posts', check('post', 'create'), (_, res) => {
  //     res.json({ success: true })
  //   })

  //   const response = await request(app)
  //     .post('/posts')
  //     .send({ title: 'Test Post' })

  //   expect(response.status).toBe(401)
  //   expect(response.body).toEqual({ error: 'You do not have permission to create a post' })
  // })

  // it('should save permix instance in request', async () => {
  //   type Definition = PermixDefinition<{
  //     user: {
  //       action: 'read' | 'write'
  //     }
  //   }>

  //   const app = express()

  //   app.use((req, res, next) => {
  //     req.permix = createPermix<Definition>()
  //     req.permix.setup({
  //       user: {
  //         read: true,
  //         write: false,
  //       },
  //     })
  //     next()
  //   })

  //   app.get('/', (req, res) => {
  //     res.json({ success: req.permix.check('user', 'read') })
  //   })

  //   const response = await request(app).get('/')

  //   expect(response.status).toBe(200)
  //   expect(response.body).toEqual({ success: true })
  // })
})

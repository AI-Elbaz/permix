import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createPermix } from '../core/createPermix'
import { createPermixMiddleware } from './createPermixMiddleware'

interface Post {
  id: string
  authorId: string
}

describe('createPermixMiddleware', () => {
  const permix = createPermix<{
    post: {
      dataType: Post
      action: 'create' | 'read' | 'update'
    }
    user: {
      action: 'delete'
    }
  }>()

  const { check } = createPermixMiddleware(permix)

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    expect(() => check('post', 'delete')()).toThrow()
  })

  it('should allow access when permission is granted', async () => {
    const app = express()

    app.use('*', async (req, res, next) => {
      await permix.setup({
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

    app.post('/posts', check('post', 'create'), (_, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true })
  })

  it('should deny access when permission is not granted', async () => {
    const app = express()

    app.use('*', async (req, res, next) => {
      await permix.setup({
        post: {
          create: false,
          read: false,
          update: false,
        },
        user: {
          delete: false,
        },
      })
      next()
    })

    app.post('/posts', check('post', 'create'), (_, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Forbidden' })
  })

  it('should work with custom error handler', async () => {
    const { check } = createPermixMiddleware(permix, {
      onUnauthorized: (_, res) => res.status(401).json({ error: 'Custom error' }),
    })

    const app = express()

    app.use('*', async (req, res, next) => {
      await permix.setup({
        post: {
          create: false,
          read: false,
          update: false,
        },
        user: {
          delete: false,
        },
      })
      next()
    })

    app.post('/posts', check('post', 'create'), (_, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Custom error' })
  })
})

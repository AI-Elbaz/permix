import type { PermixDefinition } from '../core/create-permix'
import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createPermix } from './create-permix'

interface Post {
  id: string
  authorId: string
}

type PermissionsDefinition = PermixDefinition<{
  post: {
    dataType: Post
    action: 'create' | 'read' | 'update'
  }
  user: {
    action: 'delete'
  }
}>

describe('createPermix', () => {
  const permix = createPermix<PermissionsDefinition>()

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    permix.checkMiddleware('post', 'delete')
  })

  it('should allow access when permission is granted', async () => {
    const app = express()

    app.use(permix.setupMiddleware(() => ({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permix.checkMiddleware('post', 'create'), (req, res) => {
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

    app.use(permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permix.checkMiddleware('post', 'create'), (req, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Forbidden' })
  })

  it('should work with custom error handler', async () => {
    const permix = createPermix<PermissionsDefinition>({
      onForbidden: ({ res }) => {
        res.status(403).json({ error: 'Custom error' })
      },
    })

    const app = express()

    app.use(permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permix.checkMiddleware('post', 'create'), (req, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Custom error' })
  })

  it('should work with custom error and params', async () => {
    const permix = createPermix<PermissionsDefinition>({
      onForbidden: ({ res, entity, actions }) => {
        res.status(403).json({ error: `You do not have permission to ${actions.join('/')} a ${entity}` })
      },
    })

    const app = express()

    app.use(permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permix.checkMiddleware('post', 'create'), (req, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'You do not have permission to create a post' })
  })

  it('should return an error when permix is not found', async () => {
    const app = express()

    app.get('/', (req, res) => {
      const p = permix.get(req, res)
      res.json({ permix: p })
    })

    const response = await request(app).get('/')

    expect(response.status).toBe(500)
    expect(response.body).toEqual({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' })
  })
})

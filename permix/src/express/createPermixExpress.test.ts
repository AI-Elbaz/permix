import type { PermixDefinition } from '../core/createPermix'
import express from 'express'
import request from 'supertest'
import { describe, expect, it } from 'vitest'
import { createPermixExpress } from './createPermixExpress'

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
  const permixExpress = createPermixExpress<PermissionsDefinition>()

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    expect(() => checkMiddleware('post', 'delete')()).toThrow()
  })

  it('should allow access when permission is granted', async () => {
    const app = express()

    app.use(permixExpress.setupMiddleware(() => ({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permixExpress.checkMiddleware('post', 'create'), (req, res) => {
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

    app.use(permixExpress.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permixExpress.checkMiddleware('post', 'create'), (req, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(403)
    expect(response.body).toEqual({ error: 'Forbidden' })
  })

  it('should work with custom error handler', async () => {
    const permixExpress = createPermixExpress<PermissionsDefinition>({
      onUnauthorized: ({ res }) => res.status(401).json({ error: 'Custom error' }),
    })

    const app = express()

    app.use(permixExpress.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permixExpress.checkMiddleware('post', 'create'), (req, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'Custom error' })
  })

  it('should work with custom error and params', async () => {
    const permixExpress = createPermixExpress<PermissionsDefinition>({
      onUnauthorized: ({ res, entity, actions }) => res.status(401).json({ error: `You do not have permission to ${actions.join('/')} a ${entity}` }),
    })

    const app = express()

    app.use(permixExpress.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permixExpress.checkMiddleware('post', 'create'), (req, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(401)
    expect(response.body).toEqual({ error: 'You do not have permission to create a post' })
  })

  it('should save permix instance in request', async () => {
    const app = express()

    app.use(permixExpress.setupMiddleware(() => ({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.get('/', (req, res) => {
      const permix = permixExpress.get(req)
      res.json({ success: permix.check('post', 'create') })
    })

    const response = await request(app).get('/')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true })
  })

  it('should return null when permix is not found', async () => {
    const app = express()

    app.get('/', (req, res) => {
      const permix = permixExpress.get(req)
      res.json({ permix })
    })

    const response = await request(app).get('/')

    expect(response.body).toEqual({ permix: null })
  })

  it('should work with template', async () => {
    const app = express()

    app.use(permixExpress.setupMiddleware(permixExpress.template({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permixExpress.checkMiddleware('post', 'create'), (req, res) => {
      res.json({ success: true })
    })

    const response = await request(app)
      .post('/posts')
      .send({ title: 'Test Post' })

    expect(response.status).toBe(200)
    expect(response.body).toEqual({ success: true })
  })
})

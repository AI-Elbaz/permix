import { Hono } from 'hono'
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
  }>()

  const { check } = createPermixMiddleware(permix)

  it('should allow access when permission is granted', async () => {
    const app = new Hono()

    app.use('*', async (c, next) => {
      await permix.setup({
        post: {
          create: true,
        },
      })
      await next()
    })

    app.post('/posts', check('post', 'create'), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Post' }),
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('should deny access when permission is not granted', async () => {
    const app = new Hono()

    app.use('*', async (c, next) => {
      await permix.setup({
        post: {
          create: false,
        },
      })
      await next()
    })

    app.post('/posts', check('post', 'create'), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Post' }),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('should work with custom error handler', async () => {
    const { check } = createPermixMiddleware(permix, {
      onUnauthorized: c => c.json({ error: 'Custom error' }, 401),
    })

    const app = new Hono()

    app.use('*', async (c, next) => {
      await permix.setup({
        post: {
          create: false,
        },
      })
      await next()
    })

    app.post('/posts', check('post', 'create'), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Post' }),
    })

    expect(res.status).toBe(401)
    expect(await res.json()).toEqual({ error: 'Custom error' })
  })
})

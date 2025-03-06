import type { PermixDefinition } from '../core/create-permix'
import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'
import { createPermix } from './create-permix'

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
  const permix = createPermix<Definition>()

  it('should throw ts error', async () => {
    const app = new Hono()

    // @ts-expect-error should throw
    app.post('/posts', permix.checkMiddleware('post', 'delete'), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Post' }),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Forbidden' })
  })

  it('should allow access when permission is granted', async () => {
    const app = new Hono()

    app.use('*', permix.setupMiddleware(() => ({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permix.checkMiddleware('post', 'create'), (c) => {
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

    app.use('*', permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permix.checkMiddleware('post', 'create'), (c) => {
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
    const permix = createPermix<Definition>({
      onForbidden: ({ c }) => c.json({ error: 'Custom error' }, 403),
    })

    const app = new Hono()

    app.use('*', permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permix.checkMiddleware('post', 'create'), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Post' }),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'Custom error' })
  })

  it('should work with custom error and params', async () => {
    const permix = createPermix<Definition>({
      onForbidden: ({ c, entity, actions }) => c.json({ error: `You do not have permission to ${actions.join('/')} a ${entity}` }, 403),
    })

    const app = new Hono()

    app.use('*', permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.post('/posts', permix.checkMiddleware('post', 'create'), (c) => {
      return c.json({ success: true })
    })

    const res = await app.request('/posts', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test Post' }),
    })

    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: 'You do not have permission to create a post' })
  })

  it('should save permix instance in context', async () => {
    const app = new Hono()

    app.use('*', permix.setupMiddleware(() => ({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    app.get('/', (c) => {
      const p = permix.get(c)
      return c.json({ success: p.check('post', 'create') })
    })

    const res = await app.request('/')

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it('should return an error when permix is not found', async () => {
    const app = new Hono()

    app.get('/', (c) => {
      const p = permix.get(c)
      return c.json({ permix: p })
    })

    const res = await app.request('/')

    expect(res.status).toBe(500)
    const text = await res.text()
    expect(text).toContain('[Permix] Instance not found. Please use the `setupMiddleware` function.')
  })
})

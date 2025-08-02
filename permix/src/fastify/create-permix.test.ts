import type { PermixDefinition } from '../core/create-permix'
import Fastify from 'fastify'
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
    permix.checkHandler('post', 'delete')
  })

  it('should allow access when permission is granted', async () => {
    const fastify = Fastify()

    await fastify.register(permix.plugin(() => ({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    fastify.post('/posts', {
      preHandler: permix.checkHandler('post', 'create'),
    }, (request, reply) => {
      reply.send({ success: true })
    })

    const response = await fastify.inject({
      method: 'POST',
      url: '/posts',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ success: true })
  })

  it('should deny access when permission is not granted', async () => {
    const fastify = Fastify()

    await fastify.register(permix.plugin(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    fastify.post('/posts', {
      preHandler: permix.checkHandler('post', 'create'),
    }, (request, reply) => {
      reply.send({ success: true })
    })

    const response = await fastify.inject({
      method: 'POST',
      url: '/posts',
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: 'Forbidden' })
  })

  it('should work with custom error handler', async () => {
    const permix = createPermix<PermissionsDefinition>({
      onForbidden: ({ reply }) => {
        reply.status(403).send({ error: 'Custom error' })
      },
    })

    const fastify = Fastify()

    await fastify.register(permix.plugin(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    fastify.post('/posts', {
      preHandler: permix.checkHandler('post', 'create'),
    }, (request, reply) => {
      reply.send({ success: true })
    })

    const response = await fastify.inject({
      method: 'POST',
      url: '/posts',
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: 'Custom error' })
  })

  it('should work with custom error and params', async () => {
    const permix = createPermix<PermissionsDefinition>({
      onForbidden: ({ reply, entity, actions }) => {
        reply.status(403).send({ error: `You do not have permission to ${actions.join('/')} a ${entity}` })
      },
    })

    const fastify = Fastify()

    await fastify.register(permix.plugin(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    fastify.post('/posts', {
      preHandler: permix.checkHandler('post', 'create'),
    }, (request, reply) => {
      reply.send({ success: true })
    })

    const response = await fastify.inject({
      method: 'POST',
      url: '/posts',
    })

    expect(response.statusCode).toBe(403)
    expect(response.json()).toEqual({ error: 'You do not have permission to create a post' })
  })

  it('should return an error when permix is not found', async () => {
    const fastify = Fastify()

    fastify.get('/', (request, reply) => {
      const p = permix.get(request, reply)
      reply.send({ permix: p })
    })

    const response = await fastify.inject({
      method: 'GET',
      url: '/',
    })

    expect(response.statusCode).toBe(500)
    expect(response.json()).toEqual({ error: '[Permix]: Instance not found. Please register the `plugin` function.' })
  })

  it('should work with template', async () => {
    const template = permix.template({
      post: {
        create: true,
        read: true,
        update: true,
      },
      user: {
        delete: true,
      },
    })

    const fastify = Fastify()

    await fastify.register(permix.plugin(() => template()))

    fastify.post('/posts', {
      preHandler: permix.checkHandler('post', 'create'),
    }, (request, reply) => {
      reply.send({ success: true })
    })

    const response = await fastify.inject({
      method: 'POST',
      url: '/posts',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({ success: true })
  })

  it('should dehydrate permissions', async () => {
    const template = permix.template({
      post: {
        create: true,
        read: false,
        update: true,
      },
      user: {
        delete: false,
      },
    })

    const fastify = Fastify()
    await fastify.register(permix.plugin(() => template()))

    fastify.get('/dehydrate', (request, reply) => {
      const p = permix.get(request, reply)
      reply.send(p.dehydrate())
    })

    const response = await fastify.inject({
      method: 'GET',
      url: '/dehydrate',
    })

    expect(response.statusCode).toBe(200)
    expect(response.json()).toEqual({
      post: {
        create: true,
        read: false,
        update: true,
      },
      user: {
        delete: false,
      },
    })
  })
})

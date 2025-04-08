import type { PermixDefinition } from '../core/create-permix'
import { ORPCError, os } from '@orpc/server'
import { RPCHandler } from '@orpc/server/fetch'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createPermix } from './create-permix'

interface Context {
  user: {
    id: string
  }
}

function createRequest(path: string, body: any = {}) {
  return new Request(path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
}

describe('createPermix', () => {
  const orpcPermix = os.$context<Context>()

  interface Post {
    id: string
    title: string
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

  const permix = createPermix<PermissionsDefinition>()

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    permix.checkMiddleware('post', 'delete')
  })

  it('should throw if called without setupMiddleware', async () => {
    const router = orpcPermix.router({
      // @ts-expect-error should throw
      createPost: orpcPermix
      // @ts-expect-error should throw
        .use(permix.checkMiddleware('post', 'create'))
        .handler(({ context }) => {
          // @ts-expect-error should throw
          context.permix.check('post', 'update')
          return { success: true }
        }),
    })

    const handler = new RPCHandler(router)
    const result = await handler.handle(createRequest('/createPost'), {
      context: { user: { id: '1' } },
    })

    expect(result.response?.status).toEqual(500)
  })

  it('should allow access when permission is defined', async () => {
    const protectedMiddleware = orpcPermix.use(permix.setupMiddleware(() => ({
      post: {
        create: true,
        read: true,
        update: true,
      },
      user: {
        delete: true,
      },
    })))

    const router = orpcPermix.router({
      createPost: protectedMiddleware
        .use(permix.checkMiddleware('post', 'create'))
        .handler(({ context }) => {
          context.permix.check('post', 'update')
          return { success: true }
        }),
    })

    const handler = new RPCHandler(router)
    const result = await handler.handle(createRequest('/createPost'), {
      context: { user: { id: '1' } },
    })

    expect(result.response?.status).toEqual(200)
    expect(await result.response?.json()).toEqual({ json: { success: true } })
  })

  it('should deny access when permission is not granted', async () => {
    const protectedMiddleware = orpcPermix.use(permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = orpcPermix.router({
      createPost: protectedMiddleware
        .use(permix.checkMiddleware('post', 'create'))
        .handler(() => {
          return { success: true }
        }),
    })

    const handler = new RPCHandler(router)
    const result = await handler.handle(createRequest('/createPost'), {
      context: { user: { id: '1' } },
    })

    expect(result.response?.status).toEqual(403)
  })

  it('should work with custom error', async () => {
    const customError = new ORPCError('FORBIDDEN', {
      message: 'Custom forbidden message',
    })

    const permix = createPermix({
      forbiddenError: () => customError,
    })

    const protectedMiddleware = orpcPermix.use(permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = orpcPermix.router({
      createPost: protectedMiddleware
        .use(permix.checkMiddleware('post', 'create'))
        .handler(() => {
          return { success: true }
        }),
    })

    const handler = new RPCHandler(router)
    const result = await handler.handle(createRequest('/createPost'), {
      context: { user: { id: '1' } },
    })

    expect(result.response?.status).toEqual(403)
    expect(await result.response?.json()).toEqual({
      json: {
        code: 'FORBIDDEN',
        defined: false,
        message: 'Custom forbidden message',
        status: 403,
      },
    })
  })

  it('should work with custom error and params', async () => {
    const permix = createPermix({
      forbiddenError: ({ entity, actions }) => {
        if (entity === 'post' && actions.includes('create')) {
          return new ORPCError('FORBIDDEN', {
            message: `You do not have permission to ${actions.join('/')} a ${entity}`,
          })
        }

        return new ORPCError('FORBIDDEN', {
          message: 'You do not have permission to perform this action',
        })
      },
    })

    const protectedMiddleware = orpcPermix.use(permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = orpcPermix.router({
      createPost: protectedMiddleware
        .use(permix.checkMiddleware('post', 'create'))
        .handler(() => {
          return { success: true }
        }),
    })

    const handler = new RPCHandler(router)
    const result = await handler.handle(createRequest('/createPost'), {
      context: { user: { id: '1' } },
    })

    expect(result.response?.status).toEqual(403)
    expect(await result.response?.json()).toEqual({
      json: {
        code: 'FORBIDDEN',
        defined: false,
        message: 'You do not have permission to create a post',
        status: 403,
      },
    })
  })

  it('should throw error if forbiddenError is not ORPCError', async () => {
    const permix = createPermix<PermissionsDefinition>({
      // @ts-expect-error Testing invalid error type
      forbiddenError: { message: 'Invalid error' },
    })

    const protectedMiddleware = orpcPermix.use(permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = orpcPermix.router({
      createPost: protectedMiddleware
        .use(permix.checkMiddleware('post', 'create'))
        .handler(() => {
          return { success: true }
        }),
    })

    const handler = new RPCHandler(router)
    const result = await handler.handle(createRequest('/createPost'), {
      context: { user: { id: '1' } },
    })

    expect(result.response?.status).toEqual(403)
    expect(await result.response?.json()).toEqual({
      json: {
        code: 'FORBIDDEN',
        defined: false,
        message: 'You do not have permission to perform this action',
        status: 403,
      },
    })
  })

  it('should chain multiple permissions', async () => {
    const protectedMiddleware = orpcPermix.use(permix.setupMiddleware(() => ({
      post: {
        create: true,
        read: true,
        update: true,
      },
      user: {
        delete: true,
      },
    })))

    const router = orpcPermix.router({
      createAndReadPost: protectedMiddleware
        .use(permix.checkMiddleware('post', ['create', 'read']))
        .handler(() => {
          return { success: true }
        }),
    })

    const handler = new RPCHandler(router)
    const result = await handler.handle(createRequest('/createAndReadPost'), {
      context: { user: { id: '1' } },
    })

    expect(result.response?.status).toEqual(200)
    expect(await result.response?.json()).toEqual({ json: { success: true } })
  })

  it('should save types for context and input', async () => {
    const protectedMiddleware = orpcPermix.use(permix.setupMiddleware(() => ({
      post: {
        create: true,
        read: true,
        update: true,
      },
      user: {
        delete: true,
      },
    })))

    const router = orpcPermix.router({
      createAndReadPost: protectedMiddleware
        .use(permix.checkMiddleware('post', 'read'))
        .input(z.object({
          userId: z.string(),
        }))
        .handler(({ context, input }) => {
          return {
            // @ts-expect-error user.id is string
            userId: context.user.id * 1,
            // @ts-expect-error userId is string
            inputUserId: input.userId * 1,
          }
        }),
    })

    const handler = new RPCHandler(router)
    const result = await handler.handle(createRequest('/createAndReadPost', {
      json: {
        userId: '1',
      },
    }), {
      context: { user: { id: '1' } },
    })

    expect(await result.response?.json()).toEqual({
      json: {
        userId: 1,
        inputUserId: 1,
      },
    })
  })
})

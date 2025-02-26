import type { PermixDefinition } from '../core/createPermix'
import { initTRPC, TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createPermixTrpc } from './createPermixTrpc'

interface Context {
  user: {
    id: string
  }
}

describe('createPermixTrpc', () => {
  const t = initTRPC.context<Context>().create()

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

  const permixTrpc = createPermixTrpc<PermissionsDefinition>()

  it('should throw ts and js error', () => {
    // @ts-expect-error should throw
    expect(permixTrpc.checkMiddleware('post', 'delete')).toThrow()
  })

  it('should allow access when permission is defined', async () => {
    const protectedProcedure = t.procedure.use(permixTrpc.setupMiddleware(() => ({
      post: {
        create: true,
        read: true,
        update: true,
      },
      user: {
        delete: true,
      },
    })))

    const router = t.router({
      createPost: protectedProcedure
        .use(permixTrpc.checkMiddleware('post', 'create'))
        .query(({ ctx }) => {
          ctx.permix.check('post', 'update')
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createPost()
    expect(result).toEqual({ success: true })
  })

  it('should deny access when permission is not granted', async () => {
    const protectedProcedure = t.procedure.use(permixTrpc.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = t.router({
      createPost: protectedProcedure
        .use(permixTrpc.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost()).rejects.toThrow()
  })

  it('should work with custom error', async () => {
    const customError = new TRPCError({
      code: 'FORBIDDEN',
      message: 'Custom unauthorized message',
    })

    const permixTrpc = createPermixTrpc({
      unauthorizedError: customError,
    })

    const protectedProcedure = t.procedure.use(permixTrpc.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = t.router({
      createPost: protectedProcedure
        .use(permixTrpc.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost()).rejects.toThrow('Custom unauthorized message')
  })

  it('should work with custom error and params', async () => {
    const permixTrpc = createPermixTrpc({
      unauthorizedError: ({ entity, actions }) => {
        if (entity === 'post' && actions.includes('create')) {
          return new TRPCError({
            code: 'FORBIDDEN',
            message: `You do not have permission to ${actions.join('/')} a ${entity}`,
          })
        }

        return new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You do not have permission to perform this action',
        })
      },
    })

    const protectedProcedure = t.procedure.use(permixTrpc.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = t.router({
      createPost: protectedProcedure
        .use(permixTrpc.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost())
      .rejects
      .toThrow('You do not have permission to create a post')
  })

  it('should throw error if unauthorizedError is not TRPCError', async () => {
    const permixTrpc = createPermixTrpc<PermissionsDefinition>({
      // @ts-expect-error Testing invalid error type
      unauthorizedError: { message: 'Invalid error' },
    })

    const protectedProcedure = t.procedure.use(permixTrpc.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = t.router({
      createPost: protectedProcedure
        .use(permixTrpc.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost())
      .rejects
      .toThrow()
  })

  it('should chain multiple permissions', async () => {
    const protectedProcedure = t.procedure.use(permixTrpc.setupMiddleware(() => ({
      post: {
        create: true,
        read: true,
        update: true,
      },
      user: {
        delete: true,
      },
    })))

    const router = t.router({
      createAndReadPost: protectedProcedure
        .use(permixTrpc.checkMiddleware('post', ['create', 'read']))
        .query(() => {
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createAndReadPost()
    expect(result).toEqual({ success: true })
  })

  it('should save types for context and input', async () => {
    const protectedProcedure = t.procedure.use(permixTrpc.setupMiddleware(() => ({
      post: {
        create: true,
        read: true,
        update: true,
      },
      user: {
        delete: true,
      },
    })))

    const router = t.router({
      createAndReadPost: protectedProcedure
        .use(permixTrpc.checkMiddleware('post', 'read'))
        .input(z.object({
          userId: z.string(),
        }))
        .query(({ ctx, input }) => {
          return {
            // @ts-expect-error user.id is string
            userId: ctx.user.id * 1,
            // @ts-expect-error userId is string
            inputUserId: input.userId * 1,
          }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createAndReadPost({ userId: '1' })
    expect(result).toEqual({
      userId: 1,
      inputUserId: 1,
    })
  })
})

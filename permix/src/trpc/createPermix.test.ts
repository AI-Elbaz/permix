import type { Permix, PermixDefinition } from '../core/createPermix'
import { initTRPC, TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createPermix } from './createPermix'

interface Context {
  user: {
    id: string
  }
  permix?: Pick<Permix<any>, 'check' | 'checkAsync'>
}

describe('createPermix', () => {
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

  const permix = createPermix<PermissionsDefinition>()

  it('should throw ts and js error', () => {
    // @ts-expect-error should throw
    expect(permix.checkMiddleware('post', 'delete')).toThrow()
  })

  it('should allow access when permission is defined', async () => {
    const protectedProcedure = t.procedure.use(permix.setupMiddleware(() => ({
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
        .use(permix.checkMiddleware('post', 'create'))
        .query(({ ctx }) => {
          ctx.permix!.check('post', 'update')
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createPost()
    expect(result).toEqual({ success: true })
  })

  it('should deny access when permission is not granted', async () => {
    const protectedProcedure = t.procedure.use(permix.setupMiddleware(() => ({
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
        .use(permix.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost()).rejects.toThrow()
  })

  it('should work with custom error', async () => {
    const customError = new TRPCError({
      code: 'FORBIDDEN',
      message: 'Custom forbidden message',
    })

    const permix = createPermix({
      forbiddenError: () => customError,
    })

    const protectedProcedure = t.procedure.use(permix.setupMiddleware(() => ({
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
        .use(permix.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost()).rejects.toThrow('Custom forbidden message')
  })

  it('should work with custom error and params', async () => {
    const permix = createPermix({
      forbiddenError: ({ entity, actions }) => {
        if (entity === 'post' && actions.includes('create')) {
          return new TRPCError({
            code: 'FORBIDDEN',
            message: `You do not have permission to ${actions.join('/')} a ${entity}`,
          })
        }

        return new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to perform this action',
        })
      },
    })

    const protectedProcedure = t.procedure.use(permix.setupMiddleware(() => ({
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
        .use(permix.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost())
      .rejects
      .toThrow('You do not have permission to create a post')
  })

  it('should throw error if forbiddenError is not TRPCError', async () => {
    const permix = createPermix<PermissionsDefinition>({
      // @ts-expect-error Testing invalid error type
      forbiddenError: { message: 'Invalid error' },
    })

    const protectedProcedure = t.procedure.use(permix.setupMiddleware(() => ({
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
        .use(permix.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost())
      .rejects
      .toThrow()
  })

  it('should chain multiple permissions', async () => {
    const protectedProcedure = t.procedure.use(permix.setupMiddleware(() => ({
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
        .use(permix.checkMiddleware('post', ['create', 'read']))
        .query(() => {
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createAndReadPost()
    expect(result).toEqual({ success: true })
  })

  it('should save types for context and input', async () => {
    const protectedProcedure = t.procedure.use(permix.setupMiddleware(() => ({
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
        .use(permix.checkMiddleware('post', 'read'))
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

  it('should work with template', async () => {
    const protectedProcedure = t.procedure.use(permix.setupMiddleware(permix.template({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    })))

    const router = t.router({
      createPost: protectedProcedure
        .use(permix.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createPost()
    expect(result).toEqual({ success: true })
  })
})

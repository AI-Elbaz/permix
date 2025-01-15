import { initTRPC, TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { createPermix } from '../core/createPermix'
import { createPermixMiddleware } from './createPermixMiddleware'

interface Context {
  user: {
    id: string
  }
}

describe('createPermixMiddleware', () => {
  const t = initTRPC.context<Context>().create()

  interface Post {
    id: string
    title: string
  }

  const permix = createPermix<{
    post: {
      dataType: Post
      action: 'create' | 'read' | 'update'
    }
  }>()

  const { check } = createPermixMiddleware(permix)

  it('should allow access when permission is defined', async () => {
    const protectedProcedure = t.procedure.use(async ({ next }) => {
      await permix.setup({
        post: {
          create: true,
          read: true,
          update: true,
        },
      })

      return next()
    })

    const router = t.router({
      createPost: protectedProcedure
        .use(check('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createPost()
    expect(result).toEqual({ success: true })
  })

  it('should deny access when permission is not granted', async () => {
    const protectedProcedure = t.procedure.use(async ({ next }) => {
      await permix.setup({
        post: {
          create: false,
          read: false,
          update: false,
        },
      })

      return next()
    })

    const router = t.router({
      createPost: protectedProcedure
        .use(check('post', 'create'))
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

    const { check } = createPermixMiddleware(permix, {
      unauthorizedError: customError,
    })

    const protectedProcedure = t.procedure.use(async ({ next }) => {
      await permix.setup({
        post: {
          create: false,
          read: false,
          update: false,
        },
      })

      return next()
    })

    const router = t.router({
      createPost: protectedProcedure
        .use(check('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost()).rejects.toThrow('Custom unauthorized message')
  })

  it('should chain multiple permissions', async () => {
    const protectedProcedure = t.procedure.use(async ({ next }) => {
      await permix.setup({
        post: {
          create: true,
          read: true,
          update: true,
        },
      })

      return next()
    })

    const router = t.router({
      createAndReadPost: protectedProcedure
        .use(check('post', ['create', 'read']))
        .query(() => {
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createAndReadPost()
    expect(result).toEqual({ success: true })
  })
})

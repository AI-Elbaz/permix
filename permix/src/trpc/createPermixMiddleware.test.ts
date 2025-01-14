import { initTRPC, TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { createPermix } from '../core/createPermix'
import { createPermixMiddleware } from './createPermixMiddleware'

describe('createPermixMiddleware', () => {
  const t = initTRPC.create()

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

  it('should allow access when permission is granted', async () => {
    await permix.setup({
      post: {
        create: true,
      },
    })

    const router = t.router({
      createPost: t.procedure
        .use(check('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({}).createPost()
    expect(result).toEqual({ success: true })
  })

  it('should deny access when permission is not granted', async () => {
    await permix.setup({
      post: {
        create: false,
      },
    })

    const router = t.router({
      createPost: t.procedure
        .use(check('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({}).createPost()).rejects.toThrow('You do not have permission')
  })

  it('should work with custom error', async () => {
    const customError = new TRPCError({
      code: 'FORBIDDEN',
      message: 'Custom unauthorized message',
    })

    const { check } = createPermixMiddleware(permix, {
      unauthorizedError: customError,
    })

    await permix.setup({
      post: {
        create: false,
      },
    })

    const router = t.router({
      createPost: t.procedure
        .use(check('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    await expect(t.createCallerFactory(router)({}).createPost()).rejects.toThrow('Custom unauthorized message')
  })

  it('should chain multiple permissions', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
      },
    })

    const router = t.router({
      createAndReadPost: t.procedure
        .use(check('post', 'create'))
        .use(check('post', 'read'))
        .query(() => {
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({}).createAndReadPost()
    expect(result).toEqual({ success: true })
  })
})

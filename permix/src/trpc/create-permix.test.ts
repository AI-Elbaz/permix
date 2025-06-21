import type { PermixDefinition } from '../core/create-permix'
import { initTRPC, TRPCError } from '@trpc/server'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { createPermix } from './create-permix'

interface Context {
  user: {
    id: string
  }
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

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    permix.checkMiddleware('post', 'delete')
  })

  it('should check with ctx', async () => {
    const router = t.router({
      createPost: t.procedure
        .use(({ next }) => {
          const p = permix.setup({
            post: {
              create: true,
              read: true,
              update: true,
            },
            user: {
              delete: true,
            },
          })

          return next({
            ctx: {
              permix: p,
            },
          })
        })
        .use(permix.checkMiddleware('post', 'create'))
        .query(({ ctx }) => {
          return { success: ctx.permix.check('post', 'create') }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createPost()
    expect(result).toEqual({ success: true })
  })

  it('should throw if called without setupMiddleware', async () => {
    const router = t.router({
      createPost: t.procedure
        // @ts-expect-error should throw
        .use(permix.checkMiddleware('post', 'create'))
        .query(({ ctx }) => {
          // @ts-expect-error should throw
          return { success: ctx.permix.check('post', 'update') }
        }),
    })

    await expect(t.createCallerFactory(router)({ user: { id: '1' } }).createPost()).rejects.toThrow()
  })

  it('should allow access when permission is defined', async () => {
    const protectedProcedure = t.procedure
      .use(({ next }) => {
        const p = permix.setup({
          post: {
            create: true,
            read: true,
            update: true,
          },
          user: {
            delete: true,
          },
        })

        return next({
          ctx: {
            permix: p,
          },
        })
      })

    const router = t.router({
      createPost: protectedProcedure
        .use(permix.checkMiddleware('post', 'create'))
        .query(({ ctx }) => {
          ctx.permix.check('post', 'update')
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createPost()
    expect(result).toEqual({ success: true })
  })

  it('should allow access by context', async () => {
    const protectedMiddleware = t.procedure
      .use(({ ctx, next }) => {
        const p = permix.setup({
          post: {
            create: ctx.user.id === '1',
            read: ctx.user.id === '1',
            update: ctx.user.id === '1',
          },
          user: {
            delete: ctx.user.id === '1',
          },
        })

        return next({
          ctx: {
            permix: p,
          },
        })
      })

    const router = t.router({
      createPost: protectedMiddleware
        .use(permix.checkMiddleware('post', 'create'))
        .query(() => {
          return { success: true }
        }),
    })

    const result = await t.createCallerFactory(router)({ user: { id: '1' } }).createPost()
    expect(result).toEqual({ success: true })

    await expect(t.createCallerFactory(router)({ user: { id: '2' } }).createPost()).rejects.toThrow()
  })

  it('should deny access when permission is not granted', async () => {
    const protectedProcedure = t.procedure
      .use(({ next }) => {
        const p = permix.setup({
          post: {
            create: false,
            read: false,
            update: false,
          },
          user: {
            delete: false,
          },
        })

        return next({
          ctx: {
            permix: p,
          },
        })
      })

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

    const protectedProcedure = t.procedure
      .use(({ next }) => {
        const p = permix.setup({
          post: {
            create: false,
            read: false,
            update: false,
          },
          user: {
            delete: false,
          },
        })

        return next({
          ctx: {
            permix: p,
          },
        })
      })

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

    const protectedProcedure = t.procedure
      .use(({ next }) => {
        const p = permix.setup({
          post: {
            create: false,
            read: false,
            update: false,
          },
          user: {
            delete: false,
          },
        })

        return next({
          ctx: {
            permix: p,
          },
        })
      })

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

    const protectedProcedure = t.procedure
      .use(({ next }) => {
        const p = permix.setup({
          post: {
            create: false,
            read: false,
            update: false,
          },
          user: {
            delete: false,
          },
        })

        return next({
          ctx: {
            permix: p,
          },
        })
      })

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
    const protectedProcedure = t.procedure
      .use(({ next }) => {
        const p = permix.setup({
          post: {
            create: true,
            read: true,
            update: true,
          },
          user: {
            delete: true,
          },
        })

        return next({
          ctx: {
            permix: p,
          },
        })
      })

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
    const protectedProcedure = t.procedure
      .use(({ next }) => {
        const p = permix.setup({
          post: {
            create: true,
            read: true,
            update: true,
          },
          user: {
            delete: true,
          },
        })

        return next({
          ctx: {
            permix: p,
          },
        })
      })

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
})

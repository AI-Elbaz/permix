import { permix, setupPermix } from '@/shared/permix'
import { initTRPC, TRPCError } from '@trpc/server'
import * as trpcExpress from '@trpc/server/adapters/express'
import cors from 'cors'
import express from 'express'
import { createPermixMiddleware } from 'permix/trpc'
import { z } from 'zod'

const app = express()

app.use(cors())

const t = initTRPC.create()

export const router = t.router
export const publicProcedure = t.procedure.use(({ next }) => {
  // Imagine this is a middleware that gets the user from the request
  const user = {
    role: 'admin' as const,
  }

  setupPermix(user.role)

  return next({
    ctx: {
      permix,
    },
  })
})

export const { check } = createPermixMiddleware(permix, {
  unauthorizedError: new TRPCError({
    code: 'FORBIDDEN',
    message: 'You are not authorized to access this resource',
  }),
})

export const appRouter = router({
  userList: publicProcedure
    .use(check('user', 'read'))
    // Imagine this is a database query
    .query(() => [
      {
        id: '1',
        name: 'John Doe',
        email: 'john.doe@example.com',
      },
      {
        id: '2',
        name: 'Jane Doe 2',
        email: 'jane.doe2@example.com',
      },
    ]),
  userWrite: publicProcedure
    .use(check('user', 'create'))
    .input(z.object({
      name: z.string(),
      email: z.string().email(),
    }))
    .mutation(() => {
      // Imagine this is a database mutation
      return { id: '1', name: 'John Doe', email: 'john.doe@example.com' }
    }),
})

export type AppRouter = typeof appRouter

app.use(
  '/trpc',
  trpcExpress.createExpressMiddleware({
    router: appRouter,
  }),
)
app.listen(3000, () => {
  // eslint-disable-next-line no-console
  console.log('Server is running on port 3000')
})

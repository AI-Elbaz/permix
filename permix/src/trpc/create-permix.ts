import type { Permix as PermixCore, PermixDefinition, PermixRules } from '../core/create-permix'
import type { CheckContext, CheckFunctionParams } from '../core/params'
import type { MaybePromise } from '../core/utils'
import { initTRPC, TRPCError } from '@trpc/server'
import { createPermix as createPermixCore } from '../core/create-permix'
import { createCheckContext } from '../core/params'
import { pick } from '../utils'

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error to throw when permission is denied
   */
  forbiddenError?: <C = unknown>(params: CheckContext<T> & { ctx: C }) => TRPCError
}

/**
 * Create a middleware function that checks permissions for TRPC routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/trpc
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    forbiddenError = () => new TRPCError({
      code: 'FORBIDDEN',
      message: 'You do not have permission to perform this action',
    }),
  }: PermixOptions<Definition> = {},
) {
  const plugin = initTRPC.context<{ permix: Pick<PermixCore<Definition>, 'check' | 'checkAsync'> }>().create()

  const setupMiddleware = (callback: () => MaybePromise<PermixRules<Definition>>) => plugin.middleware(async ({ ctx, next }) => {
    const permix = createPermixCore<Definition>()

    permix.setup(await callback())

    return next({
      ctx: {
        ...ctx,
        permix: pick(permix, ['check', 'checkAsync']),
      },
    })
  })

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return plugin.middleware(async ({ ctx, next }) => {
      if (!ctx.permix) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: '[Permix] Instance not found. Please use the `setupMiddleware` function.',
        })
      }

      const hasPermission = ctx.permix.check(...params)

      if (!hasPermission) {
        const error = typeof forbiddenError === 'function'
          ? forbiddenError({
              ...createCheckContext(...params),
              ctx,
            })
          : forbiddenError

        if (!(error instanceof TRPCError)) {
          console.error('forbiddenError is not TRPCError')

          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to perform this action',
          })
        }

        throw error
      }

      return next()
    })
  }

  return {
    setupMiddleware,
    checkMiddleware,
  }
}

import type { Permix as PermixCore, PermixDefinition, PermixRules } from '../core/create-permix'
import type { CheckContext, CheckFunctionParams } from '../core/params'
import type { MaybePromise } from '../core/utils'
import { ORPCError, os } from '@orpc/server'
import { createPermix as createPermixCore } from '../core/create-permix'
import { createCheckContext } from '../core/params'
import { pick } from '../utils'

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error to throw when permission is denied
   */
  forbiddenError?: <C = unknown>(params: CheckContext<T> & { context: C }) => ORPCError<any, any>
}

/**
 * Create a middleware function that checks permissions for ORPC routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/orpc
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    forbiddenError = () => new ORPCError('FORBIDDEN', {
      message: 'You do not have permission to perform this action',
    }),
  }: PermixOptions<Definition> = {},
) {
  const plugin = os.$context()

  function setupMiddleware<TContext extends object>(callback: (params: { context: TContext }) => MaybePromise<PermixRules<Definition>>) {
    return plugin.middleware(async ({ context, next }) => {
      const permix = createPermixCore<Definition>()

      permix.setup(await callback({ context: context as TContext }))

      return next({
        context: {
          ...context,
          permix: pick(permix, ['check', 'checkAsync']),
        },
      })
    })
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return plugin.$context<{ permix: Pick<PermixCore<Definition>, 'check' | 'checkAsync'> }>().middleware(async ({ context, next }) => {
      if (!context.permix) {
        throw new Error('[Permix] Instance not found. Please use the `setupMiddleware` function.')
      }

      const hasPermission = context.permix.check(...params)

      if (!hasPermission) {
        const error = typeof forbiddenError === 'function'
          ? forbiddenError({
              ...createCheckContext(...params),
              context,
            })
          : forbiddenError

        if (!(error instanceof ORPCError)) {
          console.error('forbiddenError is not ORPCError')

          throw new ORPCError('FORBIDDEN', {
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

import type { MiddlewareFunction, ProcedureParams } from '@trpc/server'
import type { PermixForbiddenContext } from '../core/adapter'
import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'
import { TRPCError } from '@trpc/server'
import { templator } from '../core'
import { createPermixForbiddenContext } from '../core/adapter'
import { createPermix as createPermixCore } from '../core/createPermix'
import { pick } from '../utils'

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error to throw when permission is denied
   */
  forbiddenError?: <C = unknown>(params: PermixForbiddenContext<T> & { ctx: C }) => TRPCError
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
  type PermixTrpc = Pick<Permix<Definition>, 'check' | 'checkAsync'>

  function setupMiddleware<
    TParams extends ProcedureParams,
    TParamsAfter extends ProcedureParams = TParams & { _ctx_out: { permix: PermixTrpc } },
  >(
    callback: (params: { ctx: TParams['_ctx_out'] }) => PermixRules<Definition> | Promise<PermixRules<Definition>>,
  ): MiddlewareFunction<TParams, TParamsAfter> {
    return async ({ ctx, next }) => {
      const permix = createPermixCore<Definition>()
      permix.setup(await callback({ ctx }))
      return next({
        ctx: {
          ...ctx,
          permix: pick(permix, ['check', 'checkAsync']),
        },
      })
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return function middleware<C extends { permix: PermixTrpc }>({ ctx, next }: { ctx: C, next: (...args: any[]) => Promise<any> }) {
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
              ...createPermixForbiddenContext(...params),
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
    }
  }

  return {
    template: templator<Definition>(),
    setupMiddleware,
    checkMiddleware,
  }
}

import type { MiddlewareFunction, ProcedureParams } from '@trpc/server'
import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'
import { TRPCError } from '@trpc/server'
import { createPermix } from '../core/createPermix'
import { templator } from '../core/template'
import { pick } from '../utils'

export interface PermixMiddlewareOptions<T extends PermixDefinition> {
  /**
   * Custom error to throw when permission is denied
   */
  unauthorizedError?: TRPCError | ((params: { entity: keyof T, actions: T[keyof T]['action'][] }) => TRPCError)
}

/**
 * Create a middleware function that checks permissions for TRPC routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/trpc
 */
export function createPermixTrpc<Definition extends PermixDefinition>(
  {
    unauthorizedError = new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You do not have permission to perform this action',
    }),
  }: PermixMiddlewareOptions<Definition> = {},
) {
  type PermixTrpc = Pick<Permix<Definition>, 'check' | 'checkAsync'>

  function setupMiddleware<
    TParams extends ProcedureParams,
    TParamsAfter extends ProcedureParams = TParams & { _ctx_out: { permix: PermixTrpc } },
  >(
    callback: (params: { ctx: TParams['_ctx_out'] }) => PermixRules<Definition> | Promise<PermixRules<Definition>>,
  ): MiddlewareFunction<TParams, TParamsAfter> {
    return async ({ ctx, next }) => {
      const permix = createPermix<Definition>()

      permix.setup(await callback({ ctx }))

      return next({ ctx: { ...ctx, permix: pick(permix, ['check', 'checkAsync']) } })
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return function middleware<C extends { permix: PermixTrpc }>({ ctx, next }: { ctx: C, next: (...args: any[]) => Promise<any> }) {
      const hasPermission = ctx.permix.check(...params)

      if (!hasPermission) {
        let error: TRPCError

        if (typeof unauthorizedError === 'function') {
          error = unauthorizedError({
            entity: params[0],
            actions: Array.isArray(params[1]) ? params[1] : [params[1]],
          })
        }
        else {
          error = unauthorizedError
        }

        if (!(error instanceof TRPCError)) {
          console.error('unauthorizedError is not TRPCError')

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
    setupMiddleware,
    checkMiddleware,
    template: templator<Definition>(),
  }
}

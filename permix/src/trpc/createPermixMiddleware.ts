import type { Permix } from '../core/createPermix'
import { initTRPC, TRPCError } from '@trpc/server'

export interface PermixMiddlewareOptions {
  /**
   * Custom error to throw when permission is denied
   */
  unauthorizedError?: TRPCError
}

export function createPermixMiddleware<TPermix extends Permix<any>>(
  permix: TPermix,
  options: PermixMiddlewareOptions = {},
) {
  const {
    unauthorizedError = new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You do not have permission to perform this action',
    }),
  } = options

  /**
   * Creates a middleware that checks for specific permission
   */
  function check<
    TEntity extends Parameters<TPermix['check']>[0],
    TAction extends Parameters<TPermix['check']>[1],
  >(entity: TEntity, action: TAction) {
    return async ({ next, ctx }: any) => {
      const hasPermission = permix.check(entity, action)

      if (!hasPermission) {
        throw unauthorizedError
      }

      return next({
        ctx: {
          ...ctx,
          permix,
        },
      })
    }
  }

  return { check }
}

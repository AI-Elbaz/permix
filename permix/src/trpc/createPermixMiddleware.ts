import type { MiddlewareFunction, ProcedureParams } from '@trpc/server'
import type { Permix, PermixPermissions } from '../core/createPermix'
import { TRPCError } from '@trpc/server'

export interface PermixMiddlewareOptions {
  /**
   * Custom error to throw when permission is denied
   */
  unauthorizedError?: TRPCError
}

export function createPermixMiddleware<T extends PermixPermissions>(
  permix: Permix<T>,
  options: PermixMiddlewareOptions = {},
) {
  const {
    unauthorizedError = new TRPCError({
      code: 'UNAUTHORIZED',
      message: 'You do not have permission to perform this action',
    }),
  } = options

  const check = <$Params extends ProcedureParams, K extends keyof T>(entity: K, action: 'all' | T[K]['action'] | T[K]['action'][]) => {
    const middleware: MiddlewareFunction<$Params, $Params> = ({ next }) => {
      const hasPermission = permix.check(entity, action)

      if (!hasPermission) {
        throw unauthorizedError
      }

      return next()
    }

    return middleware
  }

  return { check }
}

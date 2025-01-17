import type { MiddlewareFunction, ProcedureParams } from '@trpc/server'
import type { Permix, PermixPermissions, PermixSetupReturn } from '../core/createPermix'
import { TRPCError } from '@trpc/server'

export interface PermixMiddlewareOptions<T extends PermixPermissions> {
  /**
   * Setup function to set up the permix permissions
   */
  setup?: PermixSetupReturn
  /**
   * Custom error to throw when permission is denied
   */
  unauthorizedError?: TRPCError | ((params: { entity: keyof T, actions: T[keyof T]['action'][] }) => TRPCError)
}

export function createPermixMiddleware<T extends PermixPermissions>(
  permix: Permix<T>,
  options: PermixMiddlewareOptions<T> = {},
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
        let error: TRPCError

        if (typeof unauthorizedError === 'function') {
          error = unauthorizedError({
            entity,
            actions: Array.isArray(action) ? action : [action],
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

    return middleware
  }

  return { check }
}

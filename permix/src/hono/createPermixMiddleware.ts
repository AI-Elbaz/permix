import type { Context, MiddlewareHandler } from 'hono'
import type { Permix } from '../core/createPermix'

export interface PermixHonoOptions {
  /**
   * Custom error handler
   */
  onUnauthorized?: (c: Context) => Response | Promise<Response>
}

export function createPermixMiddleware<TPermix extends Permix<any>>(
  permix: TPermix,
  options: PermixHonoOptions = {},
) {
  const {
    onUnauthorized = c => c.json({ error: 'Forbidden' }, 403),
  } = options

  /**
   * Check permission for specific entity and action
   */
  function check<
    TEntity extends Parameters<TPermix['check']>[0],
    TAction extends Parameters<TPermix['check']>[1],
  >(entity: TEntity, action: TAction): MiddlewareHandler {
    return async (c, next) => {
      const hasPermission = permix.check(entity, action)

      if (!hasPermission) {
        return onUnauthorized(c)
      }

      return next()
    }
  }

  return { check }
}

import type { Context, MiddlewareHandler } from 'hono'
import type { Permix, PermixPermissions } from '../core/createPermix'

export interface PermixHonoOptions {
  /**
   * Custom error handler
   */
  onUnauthorized?: (c: Context) => Response | Promise<Response>
}

export function createPermixMiddleware<T extends PermixPermissions>(
  permix: Permix<T>,
  options: PermixHonoOptions = {},
) {
  const {
    onUnauthorized = c => c.json({ error: 'Forbidden' }, 403),
  } = options

  const check = <K extends keyof T>(entity: K, action: 'all' | T[K]['action'] | T[K]['action'][]): MiddlewareHandler => {
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

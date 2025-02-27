import type { Context, MiddlewareHandler } from 'hono'
import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'
import { createPermix } from '../core/createPermix'
import { templator } from '../core/template'
import { pick } from '../utils'

const permixSymbol = Symbol.for('permix')

export interface PermixHonoOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onUnauthorized?: (params: { c: Context, entity: keyof T, actions: T[keyof T]['action'][] }) => Response | Promise<Response>
}

/**
 * Create a middleware function that checks permissions for Hono routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/hono
 */
export function createPermixHono<Definition extends PermixDefinition>(
  {
    onUnauthorized = ({ c }) => c.json({ error: 'Forbidden' }, 403),
  }: PermixHonoOptions<Definition> = {},
) {
  type PermixHono = Pick<Permix<Definition>, 'check' | 'checkAsync'>

  function getPermix(c: Context) {
    const permix = c.get(permixSymbol as unknown as string) as PermixHono

    if (!permix) {
      console.error('[Permix]: Permix not found. Please use the `setupMiddleware` function to set the permix.')
      return null!
    }

    return pick(permix, ['check', 'checkAsync'])
  }

  function setupMiddleware(callback: (params: { c: Context }) => PermixRules<Definition> | Promise<PermixRules<Definition>>): MiddlewareHandler {
    return async (c, next) => {
      const permix = createPermix<Definition>()

      c.set(permixSymbol as unknown as string, permix)

      permix.setup(await callback({ c }))

      await next()
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>): MiddlewareHandler {
    return async function (c, next) {
      const permix = getPermix(c)

      // Handle case when permix is not found
      if (!permix) {
        console.error('[Permix]: Permix not found. Please use the `setupMiddleware` function to set the permix.')
        return onUnauthorized({
          c,
          entity: params[0],
          actions: Array.isArray(params[1]) ? params[1] : [params[1]],
        })
      }

      const hasPermission = permix.check(...params)

      if (!hasPermission) {
        return onUnauthorized({
          c,
          entity: params[0],
          actions: Array.isArray(params[1]) ? params[1] : [params[1]],
        })
      }

      await next()
    }
  }

  return {
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
    template: templator<Definition>(),
  }
}

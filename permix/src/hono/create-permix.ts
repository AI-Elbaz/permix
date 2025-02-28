import type { Context, MiddlewareHandler } from 'hono'
import type { Permix, PermixDefinition, PermixRules } from '../core/create-permix'
import type { CheckContext, CheckFunctionParams } from '../core/params'
import type { MaybePromise } from '../core/utils'
import { HTTPException } from 'hono/http-exception'
import { templator } from '../core'
import { createPermix as createPermixCore } from '../core/create-permix'
import { createCheckContext } from '../core/params'
import { pick } from '../utils'

const permixSymbol = Symbol('permix') as unknown as string

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: CheckContext<T> & { c: Context }) => MaybePromise<Response>
}

/**
 * Create a middleware function that checks permissions for Hono routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/hono
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    onForbidden = ({ c }) => c.json({ error: 'Forbidden' }, 403),
  }: PermixOptions<Definition> = {},
) {
  function setPermix(c: Context, permix: Permix<Definition>) {
    c.set(permixSymbol, permix)
  }

  function getPermix(c: Context) {
    try {
      const permix = c.get(permixSymbol) as Permix<Definition> | undefined

      if (!permix) {
        throw new Error('Not found')
      }

      return pick(permix, ['check', 'checkAsync'])
    }
    catch {
      throw new HTTPException(500, {
        message: '[Permix] Instance not found. Please use the `setupMiddleware` function.',
      })
    }
  }

  function setupMiddleware(callback: (context: { c: Context }) => PermixRules<Definition> | Promise<PermixRules<Definition>>): MiddlewareHandler {
    return async (c, next) => {
      const permix = createPermixCore<Definition>()
      permix.setup(await callback({ c }))
      setPermix(c, permix)
      await next()
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>): MiddlewareHandler {
    return async (c, next) => {
      try {
        const permix = getPermix(c)

        if (!permix)
          return

        const hasPermission = permix.check(...params)

        if (!hasPermission) {
          return await onForbidden({ c, ...createCheckContext(...params) })
        }

        await next()
      }
      catch {
        return await onForbidden({ c, ...createCheckContext(...params) })
      }
    }
  }

  return {
    template: templator<Definition>(),
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
  }
}

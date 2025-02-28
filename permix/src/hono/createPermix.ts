import type { Context, MiddlewareHandler } from 'hono'
import type { PermixForbiddenContext } from '../core/adapter'
import type { CheckFunctionParams, PermixDefinition, PermixRules } from '../core/createPermix'
import type { MaybePromise } from '../core/utils'
import { HTTPException } from 'hono/http-exception'
import { createPermixAdapter, createPermixForbiddenContext } from '../core/adapter'

const permixSymbol = Symbol('permix') as unknown as string

/**
 * Custom context type for Hono adapter
 */
type HonoMiddlewareContext = Context

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: PermixForbiddenContext<T, { c: HonoMiddlewareContext }>) => MaybePromise<Response>
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
  const permixAdapter = createPermixAdapter<Definition, HonoMiddlewareContext>({
    setPermix: (c, permix) => {
      c.set(permixSymbol, permix)
    },
    getPermix: (c) => {
      return c.get(permixSymbol)
    },
  })

  function setupMiddleware(callback: (context: HonoMiddlewareContext) => PermixRules<Definition> | Promise<PermixRules<Definition>>): MiddlewareHandler {
    return async (c, next) => {
      await permixAdapter.setupFunction(c, callback)
      await next()
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>): MiddlewareHandler {
    return async (c, next) => {
      try {
        const hasPermission = permixAdapter.checkFunction(c, ...params)

        if (!hasPermission) {
          return await onForbidden(createPermixForbiddenContext({ c }, ...params))
        }

        await next()
      }
      catch {
        return await onForbidden(createPermixForbiddenContext({ c }, ...params))
      }
    }
  }

  function getPermix(c: Context) {
    try {
      return permixAdapter.get(c)
    }
    catch {
      throw new HTTPException(500, {
        message: '[Permix] Instance not found. Please use the `setupMiddleware` function.',
      })
    }
  }

  return {
    template: permixAdapter.template,
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
  }
}

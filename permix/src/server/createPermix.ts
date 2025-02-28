import type { PermixForbiddenContext } from '../core/adapter'
import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'
import type { MaybePromise } from '../core/utils'
import { templator } from '../core'
import { createPermixForbiddenContext } from '../core/adapter'
import { createPermix as createPermixCore } from '../core/createPermix'

const permixSymbol = Symbol('permix')

/**
 * Generic server context interface
 */
export interface ServerMiddlewareContext {
  req: Request
  res: Response
  next?: () => void
}

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: PermixForbiddenContext<T> & ServerMiddlewareContext) => MaybePromise<void>
}

/**
 * Create a middleware function that checks permissions for server applications.
 * Generic implementation that can work with different server frameworks by using Request objects.
 *
 * @link https://permix.letstri.dev/docs/integrations/server
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    onForbidden = (context) => {
      // Express-like response
      if ('status' in context.res && typeof context.res.status === 'function' && 'json' in context.res && typeof context.res.json === 'function') {
        const expressRes = context.res as unknown as {
          status: (code: number) => { json: (data: any) => void }
        }
        expressRes.status(403).json({ error: 'Forbidden' })
        return
      }

      // Node.js-like response
      if ('statusCode' in context.res && 'setHeader' in context.res && 'end' in context.res) {
        const nodeRes = context.res as unknown as {
          statusCode: number
          setHeader: (name: string, value: string) => void
          end: (data: string) => void
        }
        nodeRes.statusCode = 403
        nodeRes.setHeader('Content-Type', 'application/json')
        nodeRes.end(JSON.stringify({ error: 'Forbidden' }))
      }
    },
  }: PermixOptions<Definition> = {},
) {
  function setPermix(context: ServerMiddlewareContext, permix: Permix<Definition>) {
    (context.req as any)[permixSymbol] = permix
  }

  function getPermix(context: ServerMiddlewareContext) {
    try {
      const permix = (context.req as any)[permixSymbol] as Permix<Definition> | undefined

      if (!permix) {
        throw new Error('Not found')
      }

      return permix
    }
    catch {
      // Try both response styles for error handling
      if ('status' in context.res && typeof context.res.status === 'function') {
        (context.res as any).status(500).json({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' })
      }
      else if ('statusCode' in context.res) {
        (context.res as any).statusCode = 500
        if ('setHeader' in context.res) {
          (context.res as any).setHeader('Content-Type', 'application/json')
        }
        if ('end' in context.res) {
          (context.res as any).end(JSON.stringify({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' }))
        }
      }
      return null!
    }
  }

  function setupMiddleware(callback: (context: ServerMiddlewareContext) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    return async (context: ServerMiddlewareContext) => {
      const permix = createPermixCore<Definition>()
      permix.setup(await callback(context))
      setPermix(context, permix)

      if (typeof context.next === 'function') {
        context.next()
      }
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return async (context: ServerMiddlewareContext) => {
      const permix = getPermix(context)
      const hasPermission = permix.check(...params)

      if (!hasPermission) {
        await onForbidden({ ...createPermixForbiddenContext(...params), ...context })
        return
      }

      try {
        if (typeof context.next === 'function') {
          context.next()
        }
      }
      catch (error: unknown) {
        // Handle any errors that occur during middleware execution
        console.error('[Permix]: Error during middleware execution', error)

        // Try both response styles
        if ('status' in context.res && typeof context.res.status === 'function') {
          (context.res as any).status(500).json({ error: 'Internal Server Error' })
        }
        else if ('statusCode' in context.res) {
          (context.res as any).statusCode = 500
          if ('setHeader' in context.res) {
            (context.res as any).setHeader('Content-Type', 'application/json')
          }
          if ('end' in context.res) {
            (context.res as any).end(JSON.stringify({ error: 'Internal Server Error' }))
          }
        }
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

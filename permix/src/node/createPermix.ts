import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PermixForbiddenContext } from '../core/adapter'
import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'
import { templator } from '../core'
import { createPermixForbiddenContext } from '../core/adapter'
import { createPermix as createPermixCore } from '../core/createPermix'
import { pick } from '../utils'

const permixSymbol = Symbol('permix')

/**
 * Custom context type for Node adapter
 */
export interface NodeMiddlewareContext {
  req: IncomingMessage
  res: ServerResponse<IncomingMessage>
  next?: () => void
}

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: PermixForbiddenContext<T> & NodeMiddlewareContext) => void
}

/**
 * Create a middleware function that checks permissions for Node.js HTTP servers.
 * Compatible with raw Node.js HTTP servers.
 *
 * @link https://permix.letstri.dev/docs/integrations/server
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    onForbidden = ({ res }) => {
      res.statusCode = 403
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Forbidden' }))
    },
  }: PermixOptions<Definition> = {},
) {
  function setPermix(req: IncomingMessage, permix: Permix<Definition>) {
    (req as any)[permixSymbol] = permix
  }

  function getPermix(req: IncomingMessage, res: ServerResponse<IncomingMessage>) {
    try {
      const permix = (req as any)[permixSymbol] as Permix<Definition> | undefined

      if (!permix) {
        throw new Error('Not found')
      }

      return pick(permix, ['check', 'checkAsync'])
    }
    catch {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' }))
      return null!
    }
  }

  function setupMiddleware(callback: (context: NodeMiddlewareContext) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    return async (context: NodeMiddlewareContext) => {
      const permix = createPermixCore<Definition>()
      permix.setup(await callback(context))
      setPermix(context.req, permix)

      if (typeof context.next === 'function') {
        context.next()
      }
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return async (context: NodeMiddlewareContext) => {
      const permix = getPermix(context.req, context.res)

      if (!permix)
        return

      const hasPermission = permix.check(...params)

      if (!hasPermission) {
        await onForbidden({
          ...createPermixForbiddenContext(...params),
          req: context.req,
          res: context.res,
        })
        return
      }

      try {
        if (typeof context.next === 'function') {
          context.next()
        }
      }
      catch {
        context.res.statusCode = 500
        context.res.setHeader('Content-Type', 'application/json')
        context.res.end(JSON.stringify({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' }))
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

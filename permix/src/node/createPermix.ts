import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PermixForbiddenContext } from '../core/adapter'
import type { CheckFunctionParams, PermixDefinition, PermixRules } from '../core/createPermix'
import type { MaybePromise } from '../core/utils'
import { createPermixAdapter, createPermixForbiddenContext } from '../core/adapter'

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
  onForbidden?: (params: PermixForbiddenContext<T, NodeMiddlewareContext>) => MaybePromise<void>
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
  const permixAdapter = createPermixAdapter<Definition, NodeMiddlewareContext>({
    setPermix: (context, permix) => {
      (context.req as any)[permixSymbol] = permix
    },
    getPermix: (context) => {
      return (context.req as any)[permixSymbol]
    },
  })

  function setupMiddleware(callback: (context: NodeMiddlewareContext) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    return async (context: NodeMiddlewareContext) => {
      await permixAdapter.setupFunction(context, callback)

      if (typeof context.next === 'function') {
        context.next()
      }
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return async (context: NodeMiddlewareContext) => {
      const hasPermission = permixAdapter.checkFunction(context, ...params)

      if (!hasPermission) {
        await onForbidden(createPermixForbiddenContext(context, ...params))
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

  function getPermix(context: NodeMiddlewareContext) {
    try {
      return permixAdapter.get(context)
    }
    catch {
      context.res.statusCode = 500
      context.res.setHeader('Content-Type', 'application/json')
      context.res.end(JSON.stringify({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' }))
      return null!
    }
  }

  return {
    template: permixAdapter.template,
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
  }
}

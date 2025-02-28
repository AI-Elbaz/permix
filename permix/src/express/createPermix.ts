import type { Handler, Request, Response } from 'express'
import type { PermixForbiddenContext } from '../core/adapter'
import type { CheckFunctionParams, PermixDefinition, PermixRules } from '../core/createPermix'
import type { MaybePromise } from '../core/utils'
import { createPermixAdapter, createPermixForbiddenContext } from '../core/adapter'

const permixSymbol = Symbol('permix')

interface ExpressMiddlewareContext {
  req: Request
  res: Response
}

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: PermixForbiddenContext<T, ExpressMiddlewareContext>) => MaybePromise<void>
}

/**
 * Create a middleware function that checks permissions for Express routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/express
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    onForbidden = ({ res }) => {
      res.status(403).json({ error: 'Forbidden' })
    },
  }: PermixOptions<Definition> = {},
) {
  const permixAdapter = createPermixAdapter<Definition, ExpressMiddlewareContext>({
    setPermix: ({ req }, permix) => {
      (req as any)[permixSymbol] = permix
    },
    getPermix: ({ req }) => {
      return (req as any)[permixSymbol]
    },
  })

  function setupMiddleware(callback: (context: ExpressMiddlewareContext) => PermixRules<Definition> | Promise<PermixRules<Definition>>): Handler {
    return async (req, res, next) => {
      const context = { req, res } satisfies ExpressMiddlewareContext

      await permixAdapter.setupFunction(context, callback)
      next()
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>): Handler {
    return async (req, res, next) => {
      const context = { req, res } satisfies ExpressMiddlewareContext

      const hasPermission = permixAdapter.checkFunction(context, ...params)

      if (!hasPermission) {
        await onForbidden(createPermixForbiddenContext(context, ...params))
        return
      }

      next()
    }
  }

  function getPermix(context: ExpressMiddlewareContext) {
    try {
      return permixAdapter.get(context)
    }
    catch {
      context.res.status(500).json({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' })
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

import type { Handler, Request, Response } from 'express'
import type { PermixForbiddenContext } from '../core/adapter'
import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'
import type { MaybePromise } from '../core/utils'
import { templator } from '../core'
import { createPermixForbiddenContext } from '../core/adapter'
import { createPermix as createPermixCore } from '../core/createPermix'
import { pick } from '../utils'

const permixSymbol = Symbol('permix')

interface ExpressMiddlewareContext {
  req: Request
  res: Response
}

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: PermixForbiddenContext<T> & ExpressMiddlewareContext) => MaybePromise<void>
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
  function setPermix(req: Request, permix: Permix<Definition>) {
    (req as any)[permixSymbol] = permix
  }

  function getPermix(req: Request, res: Response) {
    try {
      const permix = (req as any)[permixSymbol] as Permix<Definition> | undefined

      if (!permix) {
        throw new Error('Not found')
      }

      return pick(permix, ['check', 'checkAsync'])
    }
    catch {
      res.status(500).json({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' })
      return null!
    }
  }

  function setupMiddleware(callback: (context: ExpressMiddlewareContext) => MaybePromise<PermixRules<Definition>>): Handler {
    return async (req, res, next) => {
      const permix = createPermixCore<Definition>()

      permix.setup(await callback({ req, res }))

      setPermix(req, permix)

      return next()
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>): Handler {
    return async (req, res, next) => {
      const permix = getPermix(req, res)

      if (!permix)
        return

      const hasPermission = permix.check(...params)

      if (!hasPermission) {
        await onForbidden({
          req,
          res,
          ...createPermixForbiddenContext(...params),
        })
        return
      }

      return next()
    }
  }

  return {
    template: templator<Definition>(),
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
  }
}

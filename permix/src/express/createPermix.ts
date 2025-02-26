import type { NextFunction, Request, Response } from 'express'
import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'
import { createPermix as createPermixCore } from '../core/createPermix'

const permixSymbol = Symbol('permix')

export interface PermixExpressOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onUnauthorized?: (params: { req: Request, res: Response, next: NextFunction, entity: keyof T, actions: T[keyof T]['action'][] }) => void
}

/**
 * Create a middleware function that checks permissions for Express routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/express
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    onUnauthorized = ({ res }) => res.status(403).json({ error: 'Forbidden' }),
  }: PermixExpressOptions<Definition> = {},
) {
  type PermixRequest = Request & { [permixSymbol]: Permix<Definition> }

  function getPermix(req: Request) {
    return (req as PermixRequest)[permixSymbol]
  }

  function setPermix(req: Request, permix: Permix<Definition>) {
    (req as PermixRequest)[permixSymbol] = permix
  }

  function setupPermixMiddleware(callback: (params: { req: Request, res: Response }) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    return async (req: Request, res: Response, next: NextFunction) => {
      let permix = getPermix(req)

      if (!permix) {
        permix = createPermixCore<Definition>()
        setPermix(req, permix)
      }

      permix.setup(await callback({ req, res }))
      next()
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return (req: Request, res: Response, next: NextFunction) => {
      const hasPermission = getPermix(req).check(...params)

      if (!hasPermission) {
        return onUnauthorized({ req, res, next, entity: params[0], actions: Array.isArray(params[1]) ? params[1] : [params[1]] })
      }

      next()
    }
  }

  return { setupPermixMiddleware, getPermix, checkMiddleware }
}

import type { NextFunction, Request, Response } from 'express'
import type { CheckFunctionParams, Permix, PermixDefinition } from '../core/createPermix'
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

  function permixMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!getPermix(req)) {
      setPermix(req, createPermixCore<Definition>())
    }

    next()
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return (req: Request, res: Response, next: NextFunction) => {
      const hasPermission = getPermix(req).check(...params)

      if (!hasPermission) {
        return onUnauthorized({ req, res, next, entity: params[0], actions: params[1] as Definition[K]['action'][] })
      }

      next()
    }
  }

  return { permixMiddleware, getPermix, checkMiddleware }
}

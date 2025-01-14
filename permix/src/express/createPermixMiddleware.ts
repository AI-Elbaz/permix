import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Permix } from '../core/createPermix'

export interface PermixExpressOptions {
  /**
   * Custom error handler
   */
  onUnauthorized?: (req: Request, res: Response, next: NextFunction) => void
}

export function createPermixMiddleware<TPermix extends Permix<any>>(
  permix: TPermix,
  options: PermixExpressOptions = {},
) {
  const {
    onUnauthorized = (_, res) => res.status(403).json({ error: 'Forbidden' }),
  } = options

  /**
   * Check permission for specific entity and action
   */
  function check<
    TEntity extends Parameters<TPermix['check']>[0],
    TAction extends Parameters<TPermix['check']>[1],
  >(entity: TEntity, action: TAction): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const hasPermission = permix.check(entity, action)

      if (!hasPermission) {
        return onUnauthorized(req, res, next)
      }

      next()
    }
  }

  return { check }
}

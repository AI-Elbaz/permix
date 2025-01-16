import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Permix, PermixPermissions } from '../core/createPermix'

export interface PermixExpressOptions {
  /**
   * Custom error handler
   */
  onUnauthorized?: (req: Request, res: Response, next: NextFunction) => void
}

export function createPermixMiddleware<T extends PermixPermissions>(
  permix: Permix<T>,
  options: PermixExpressOptions = {},
) {
  const {
    onUnauthorized = (_, res) => res.status(403).json({ error: 'Forbidden' }),
  } = options

  const check = <K extends keyof T>(entity: K, action: 'all' | T[K]['action'] | T[K]['action'][]): RequestHandler => {
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

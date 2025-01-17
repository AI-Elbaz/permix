import type { NextFunction, Request, RequestHandler, Response } from 'express'
import type { Permix, PermixPermissions } from '../core/createPermix'

export interface PermixExpressOptions<T extends PermixPermissions> {
  /**
   * Custom error handler
   */
  onUnauthorized?: (params: { req: Request, res: Response, next: NextFunction, entity: keyof T, actions: T[keyof T]['action'][] }) => void
}

export function createPermixMiddleware<T extends PermixPermissions>(
  permix: Permix<T>,
  options: PermixExpressOptions<T> = {},
) {
  const {
    onUnauthorized = ({ res }) => res.status(403).json({ error: 'Forbidden' }),
  } = options

  const check = <K extends keyof T>(entity: K, action: 'all' | T[K]['action'] | T[K]['action'][]): RequestHandler => {
    return (req: Request, res: Response, next: NextFunction) => {
      const hasPermission = permix.check(entity, action)

      if (!hasPermission) {
        return onUnauthorized({ req, res, next, entity, actions: Array.isArray(action) ? action : [action] })
      }

      next()
    }
  }

  return { check }
}

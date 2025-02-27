import type { NextFunction, Request, Response } from 'express'
import type { CheckFunctionParams, PermixDefinition, PermixRules } from '../core/createPermix'
import type { PermixOptions as PermixServerOptions } from '../server/createPermix'
import { createPermix as createPermixServer } from '../server/createPermix'

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: {
    req: Request
    res: Response
    entity: keyof T
    actions: T[keyof T]['action'][]
  }) => void
}

/**
 * Create a middleware function that checks permissions for Express routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/express
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    onForbidden = ({ res }) => res.status(403).json({ error: 'Forbidden' }),
  }: PermixOptions<Definition> = {},
) {
  const serverOptions: PermixServerOptions<Definition> = {
    onForbidden: ({ req, res, entity, actions }) => {
      const expressReq = req as unknown as Request
      const expressRes = res as unknown as Response

      return onForbidden({
        req: expressReq,
        res: expressRes,
        entity,
        actions,
      })
    },
  }

  const permix = createPermixServer<Definition>(serverOptions)

  function setupMiddleware(callback: (params: { req: Request }) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    const serverMiddleware = permix.setupMiddleware(({ req }) => callback({ req: req as unknown as Request }))

    return (req: Request, res: Response, next: NextFunction) => {
      return serverMiddleware(
        req as unknown as globalThis.Request,
        res as unknown as globalThis.Response,
        next,
      )
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    const serverMiddleware = permix.checkMiddleware(...params)

    return (req: Request, res: Response, next: NextFunction) => {
      return serverMiddleware(
        req as unknown as globalThis.Request,
        res as unknown as globalThis.Response,
        next,
      )
    }
  }

  function getPermix(req: Request) {
    return permix.get(req as unknown as globalThis.Request)
  }

  return {
    template: permix.template,
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
  }
}

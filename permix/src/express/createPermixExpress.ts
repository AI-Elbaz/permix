import type { NextFunction, Request, Response } from 'express'
import type { CheckFunctionParams, PermixDefinition, PermixRules } from '../core/createPermix'
import type { PermixServerOptions } from '../server/createPermixServer'
import { createPermixServer } from '../server/createPermixServer'

export interface PermixExpressOptions<T extends PermixDefinition> {
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
export function createPermixExpress<Definition extends PermixDefinition>(
  {
    onForbidden = ({ res }) => res.status(403).json({ error: 'Forbidden' }),
  }: PermixExpressOptions<Definition> = {},
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

  const permixServer = createPermixServer<Definition>(serverOptions)

  // Wrap server functions to adapt Express types
  function setupMiddleware(callback: (params: { req: Request }) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    const serverMiddleware = permixServer.setupMiddleware(({ req }) => callback({ req: req as unknown as Request }))

    return (req: Request, res: Response, next: NextFunction) => {
      return serverMiddleware(
        req as unknown as globalThis.Request,
        res as unknown as globalThis.Response,
        next,
      )
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    const serverMiddleware = permixServer.checkMiddleware(...params)

    return (req: Request, res: Response, next: NextFunction) => {
      return serverMiddleware(
        req as unknown as globalThis.Request,
        res as unknown as globalThis.Response,
        next,
      )
    }
  }

  function getPermix(req: Request) {
    return permixServer.get(req as unknown as globalThis.Request)
  }

  return {
    template: permixServer.template,
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
  }
}

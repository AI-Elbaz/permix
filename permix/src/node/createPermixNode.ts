import type { IncomingMessage, ServerResponse } from 'node:http'
import type { CheckFunctionParams, PermixDefinition, PermixRules } from '../core/createPermix'
import type { PermixServerOptions } from '../server/createPermixServer'
import { createPermixServer } from '../server/createPermixServer'

export interface PermixNodeOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: {
    req: IncomingMessage
    res: ServerResponse
    entity: keyof T
    actions: T[keyof T]['action'][]
  }) => void
}

/**
 * Create a middleware function that checks permissions for Node.js HTTP servers.
 * Compatible with Next.js, Nuxt.js, and raw Node.js HTTP servers.
 *
 * @link https://permix.letstri.dev/docs/integrations/server
 */
export function createPermixNode<Definition extends PermixDefinition>(
  {
    onForbidden = ({ res }) => {
      res.statusCode = 403
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Forbidden' }))
    },
  }: PermixNodeOptions<Definition> = {},
) {
  const serverOptions: PermixServerOptions<Definition> = {
    onForbidden: ({ req, res, entity, actions }) => {
      // Cast standard Request/Response to Node.js types
      const nodeReq = req as unknown as IncomingMessage
      const nodeRes = res as unknown as ServerResponse

      return onForbidden({
        req: nodeReq,
        res: nodeRes,
        entity,
        actions,
      })
    },
  }

  const permixServer = createPermixServer<Definition>(serverOptions)

  // Wrap server functions to adapt Node.js types
  function setupMiddleware(callback: (params: { req: IncomingMessage }) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    const serverMiddleware = permixServer.setupMiddleware(({ req }) => callback({ req: req as unknown as IncomingMessage }))

    return (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
      return serverMiddleware(
        req as unknown as globalThis.Request,
        res as unknown as globalThis.Response,
        next,
      )
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    const serverMiddleware = permixServer.checkMiddleware(...params)

    return (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
      return serverMiddleware(
        req as unknown as globalThis.Request,
        res as unknown as globalThis.Response,
        next,
      )
    }
  }

  function getPermix(req: IncomingMessage) {
    return permixServer.get(req as unknown as globalThis.Request)
  }

  return {
    template: permixServer.template,
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
  }
}

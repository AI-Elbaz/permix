import type { IncomingMessage, ServerResponse } from 'node:http'
import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'

import { createPermix } from '../core/createPermix'
import { templator } from '../core/template'
import { pick } from '../utils'

const permixSymbol = Symbol('permix')

export interface PermixServerOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onUnauthorized?: (params: {
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
    onUnauthorized = ({ res }) => {
      res.statusCode = 403
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Forbidden' }))
    },
  }: PermixServerOptions<Definition> = {},
) {
  type PermixServerReq = Pick<Permix<Definition>, 'check' | 'checkAsync'>
  type PermixRequest = IncomingMessage & { [permixSymbol]: PermixServerReq }

  function getPermix(req: IncomingMessage) {
    const permix = (req as PermixRequest)[permixSymbol]

    if (!permix) {
      console.error('[Permix]: Permix not found. Please use the `setupMiddleware` function to set the permix.')
      return null!
    }

    return pick(permix, ['check', 'checkAsync'])
  }

  function setupMiddleware(callback: (params: { req: IncomingMessage, res: ServerResponse }) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    return async (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
      const permix = createPermix<Definition>()

      ;(req as PermixRequest)[permixSymbol] = permix

      permix.setup(await callback({ req, res }))

      if (typeof next === 'function') {
        next()
      }
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return (req: IncomingMessage, res: ServerResponse, next?: () => void) => {
      const hasPermission = getPermix(req).check(...params)

      if (!hasPermission) {
        return onUnauthorized({
          req,
          res,
          entity: params[0],
          actions: Array.isArray(params[1]) ? params[1] : [params[1]],
        })
      }

      if (typeof next === 'function') {
        return next()
      }
    }
  }

  return {
    template: templator<Definition>(),
    setupMiddleware,
    get: getPermix,
    checkMiddleware,
  }
}

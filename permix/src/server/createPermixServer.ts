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
    req: Request
    res: Response
    entity: keyof T
    actions: T[keyof T]['action'][]
    next?: () => void
  }) => void
}

/**
 * Create a middleware function that checks permissions for server applications.
 * Generic implementation that can work with different server frameworks by using Request objects.
 *
 * @link https://permix.letstri.dev/docs/integrations/server
 */
export function createPermixServer<Definition extends PermixDefinition>(
  {
    onUnauthorized = ({ res }) => {
      // Express-like response
      if ('status' in res && typeof res.status === 'function' && 'json' in res && typeof res.json === 'function') {
        const expressRes = res as unknown as {
          status: (code: number) => { json: (data: any) => void }
        }
        expressRes.status(403).json({ error: 'Forbidden' })
        return
      }

      // Node.js-like response
      if ('statusCode' in res && 'setHeader' in res && 'end' in res) {
        const nodeRes = res as unknown as {
          statusCode: number
          setHeader: (name: string, value: string) => void
          end: (data: string) => void
        }
        nodeRes.statusCode = 403
        nodeRes.setHeader('Content-Type', 'application/json')
        nodeRes.end(JSON.stringify({ error: 'Forbidden' }))
      }
    },
  }: PermixServerOptions<Definition> = {},
) {
  type PermixServer = Pick<Permix<Definition>, 'check' | 'checkAsync'>
  type PermixRequest = Request & { [permixSymbol]: PermixServer }

  function getPermix(req: Request) {
    const permix = (req as PermixRequest)[permixSymbol]

    if (!permix) {
      console.error('[Permix]: Permix not found. Please use the `setupMiddleware` function to set the permix.')
      return null!
    }

    return pick(permix, ['check', 'checkAsync'])
  }

  function setupMiddleware(callback: (params: { req: Request, res: Response }) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    return async (req: Request, res: Response, next?: () => void) => {
      const permix = createPermix<Definition>()

      ;(req as PermixRequest)[permixSymbol] = permix

      permix.setup(await callback({ req, res }))

      if (typeof next === 'function') {
        next()
      }
    }
  }

  function checkMiddleware<K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) {
    return (req: Request, res: Response, next?: () => void) => {
      const hasPermission = getPermix(req).check(...params)

      if (!hasPermission) {
        return onUnauthorized({
          req,
          res,
          next,
          entity: params[0],
          actions: Array.isArray(params[1]) ? params[1] : [params[1]],
        })
      }

      if (typeof next === 'function') {
        next()
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

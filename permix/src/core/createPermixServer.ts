import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from '../core/createPermix'
import { createPermix } from '../core/createPermix'
import { templator } from '../core/template'
import { pick } from '../utils'

const permixSymbol = Symbol('permix')

export interface PermixServerOptions<T extends PermixDefinition, Req extends object = Request, Res extends object = Response> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: {
    req: Req
    res: Res
    entity: keyof T
    actions: T[keyof T]['action'][]
  }) => void
}

export interface PermixServer<Definition extends PermixDefinition, Req extends object = Request, Res extends object = Response> {
  /**
   * Define permissions in different place to setup them later.
   *
   * @link https://permix.letstri.dev/docs/guide/template
   *
   * @example
   * ```ts
   * // Some file where you want to define setup without permix instance
   * import { permix } from './permix'
   *
   * const adminPermissions = permix.template({
   *   post: {
   *     create: true,
   *     read: false
   *   }
   * })
   *
   * // Now you can use setup
   * permix.setup(adminPermissions)
   * ```
   */
  template: ReturnType<typeof templator<Definition>>

  /**
   * Set up permissions middleware for server applications.
   *
   * @link https://permix.letstri.dev/docs/guide/setup
   *
   * @example
   * ```ts
   * // Setup middleware with a callback function
   * app.use(permix.setupMiddleware(({ req }) => ({
   *   post: { create: req.user.isAdmin, read: true }
   * })))
   * ```
   */
  setupMiddleware: (callback: (params: { req: Req }) => PermixRules<Definition> | Promise<PermixRules<Definition>>) => (req: Req, res: Res, next?: () => void) => Promise<void>

  /**
   * Get permix instance from request.
   */
  get: (req: Req) => Pick<Permix<Definition>, 'check' | 'checkAsync'>

  /**
   * Create a middleware function that checks permissions for server applications.
   */
  checkMiddleware: <K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) => (req: Req, res: Res, next?: () => void) => void
}

/**
 * Create a middleware function that checks permissions for server applications.
 * Generic implementation that can work with different server frameworks by using Request objects.
 *
 * @link https://permix.letstri.dev/docs/integrations/server
 */
export function createPermixServer<Definition extends PermixDefinition, Req extends object = Request, Res extends object = Response>(
  {
    onForbidden = ({ res }) => {
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
  }: PermixServerOptions<Definition, Req, Res> = {},
): PermixServer<Definition, Req, Res> {
  type PermixServerInstance = Pick<Permix<Definition>, 'check' | 'checkAsync'>
  type PermixRequest = Req & { [permixSymbol]: PermixServerInstance }

  function getPermix(req: Req) {
    const permix = (req as PermixRequest)[permixSymbol]

    if (!permix) {
      console.error('[Permix]: Permix not found. Please use the `setupMiddleware` function to set the permix.')
      return null!
    }

    return pick(permix, ['check', 'checkAsync'])
  }

  return {
    template: templator(),
    get: getPermix,
    setupMiddleware(callback) {
      return async (req, res, next) => {
        const permix = createPermix<Definition>()

        ;(req as PermixRequest)[permixSymbol] = permix

        permix.setup(await callback({ req }))

        if (typeof next === 'function') {
          next()
        }
      }
    },
    checkMiddleware(...params) {
      return (req, res, next) => {
        const hasPermission = getPermix(req).check(...params)

        if (!hasPermission) {
          return onForbidden({
            req,
            res,
            entity: params[0],
            actions: Array.isArray(params[1]) ? params[1] : [params[1]],
          })
        }

        if (typeof next === 'function') {
          next()
        }
      }
    },
  }
}

import type { Permix as PermixCore, PermixDefinition, PermixRules } from '../core/create-permix'
import type { MaybePromise } from '../core/utils'
import { createPermix as createPermixCore } from '../core/create-permix'
import { pick } from '../utils'

const permixSymbol = Symbol('permix')

export interface MiddlewareContext {
  req: Request
}

export interface Permix<Definition extends PermixDefinition> {
  /**
   * Setup the middleware
   */
  setup: (req: Request, callback: (context: MiddlewareContext) => MaybePromise<PermixRules<Definition>>) => MaybePromise<void>
  /**
   * Get the Permix instance
   */
  get: (req: Request) => Pick<PermixCore<Definition>, 'check' | 'checkAsync'>

}

/**
 * Create a middleware function that checks permissions for Express routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/server
 */
export function createPermix<Definition extends PermixDefinition>(): Permix<Definition> {
  function getPermix(req: Request) {
    try {
      const permix = (req as any)[permixSymbol] as PermixCore<Definition> | undefined

      if (!permix) {
        throw new Error('Not found')
      }

      return pick(permix, ['check', 'checkAsync'])
    }
    catch {
      throw new Error('[Permix]: Instance not found. Please use the `setupMiddleware` function.')
    }
  }

  async function setup(req: Request, callback: (context: MiddlewareContext) => MaybePromise<PermixRules<Definition>>) {
    const permix = createPermixCore<Definition>()

    permix.setup(await callback({ req }))

    ;(req as any)[permixSymbol] = permix
  }

  return {
    setup,
    get: getPermix,
  }
}

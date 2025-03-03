import type { Permix, PermixDefinition, PermixRules } from '../core/create-permix'
import type { MaybePromise } from '../core/utils'
import { createPermix as createPermixCore } from '../core/create-permix'
import { pick } from '../utils'

const permixSymbol = Symbol('permix')

interface MiddlewareContext {
  req: Request
}

/**
 * Create a middleware function that checks permissions for Express routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/server
 */
export function createPermix<Definition extends PermixDefinition>() {
  function getPermix(req: Request) {
    try {
      const permix = (req as any)[permixSymbol] as Permix<Definition> | undefined

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

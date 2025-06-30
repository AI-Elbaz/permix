import type { Context } from 'elysia'
import type { Permix as PermixCore, PermixDefinition, PermixRules } from '../core/create-permix'
import type { CheckContext, CheckFunctionParams } from '../core/params'
import type { MaybePromise } from '../core/utils'
import { createPermix as createPermixCore } from '../core/create-permix'
import { createCheckContext } from '../core/params'
import { pick } from '../utils'

export interface ElysiaContext {
  context: Context
}

export interface PermixOptions<T extends PermixDefinition> {
  /**
   * Custom error handler
   */
  onForbidden?: (params: CheckContext<T> & ElysiaContext) => MaybePromise<any>
}

export interface Permix<Definition extends PermixDefinition> {
  /**
   * Setup the middleware
   */
  derive: (rules: PermixRules<Definition>) => { permix: Pick<PermixCore<Definition>, 'check'> }
  /**
   * Check the middleware
   */
  checkHandler: <K extends keyof Definition>(...params: CheckFunctionParams<Definition, K>) => (context: Context & { permix: Pick<PermixCore<Definition>, 'check'> }) => MaybePromise<void>
}

/**
 * Create a middleware function that checks permissions for Elysia routes.
 *
 * @link https://permix.letstri.dev/docs/integrations/elysia
 */
export function createPermix<Definition extends PermixDefinition>(
  {
    onForbidden = ({ context }) => {
      context.set.status = 403
      return { error: 'Forbidden' }
    },
  }: PermixOptions<Definition> = {},
): Permix<Definition> {
  const derive: Permix<Definition>['derive'] = rules => ({
    permix: pick(createPermixCore<Definition>(rules), ['check', 'checkAsync']),
  })

  const checkHandler: Permix<Definition>['checkHandler'] = (...params) => {
    return async (context) => {
      if (!context.permix) {
        throw new Error('[Permix]: Instance not found. Please use the `setupMiddleware` function.')
      }

      const hasPermission = context.permix.check(...params)

      if (!hasPermission) {
        return onForbidden({
          context,
          ...createCheckContext(...params),
        })
      }
    }
  }

  return {
    derive,
    checkHandler,
  }
}

import type { CheckFunctionParams, Permix, PermixDefinition, PermixRules } from './createPermix'
import { pick } from '../utils'
import { createPermix as createPermixCore } from './createPermix'
import { templator } from './template'

export type PermixForbiddenContext<Definition extends PermixDefinition, Context extends object> = Context & {
  entity: keyof Definition
  actions: Definition[keyof Definition]['action'][]
}

export function createPermixForbiddenContext<Definition extends PermixDefinition, Context extends object>(context: Context, ...params: CheckFunctionParams<Definition, keyof Definition>) {
  const [entity, action] = params

  return {
    ...context,
    entity,
    actions: Array.isArray(action) ? action : [action],
  }
}

export interface PermixAdapterOptions<Definition extends PermixDefinition, Context extends object> {
  /**
   * Function to store the Permix instance
   */
  setPermix: (context: Context, permix: Pick<Permix<Definition>, 'check' | 'checkAsync'>) => void

  /**
   * Function to retrieve the Permix instance
   */
  getPermix: (context: Context) => Pick<Permix<Definition>, 'check' | 'checkAsync'>
}

/**
 * Base adapter function that powers framework-specific integrations
 * This provides the core functionality that can be adapted to different frameworks
 *
 * @internal
 */
export function createPermixAdapter<
  Definition extends PermixDefinition,
  Context extends object,
>(options: PermixAdapterOptions<Definition, Context>) {
  function getPermix(context: Context) {
    const permix = options.getPermix(context)

    if (!permix) {
      throw new Error('[Permix]: Permix not found. Please use the setup function to attach permix to the request.')
    }

    return pick(permix, ['check', 'checkAsync'])
  }

  async function setupFunction(context: Context, callback: (context: Context) => PermixRules<Definition> | Promise<PermixRules<Definition>>) {
    const permix = createPermixCore<Definition>()
    options.setPermix(context, permix)
    permix.setup(await callback(context))
  }

  function checkFunction<K extends keyof Definition>(context: Context, ...params: CheckFunctionParams<Definition, K>) {
    const permix = getPermix(context)

    return permix.check(...params)
  }

  return {
    template: templator<Definition>(),
    get: getPermix,
    setupFunction,
    checkFunction,
  }
}

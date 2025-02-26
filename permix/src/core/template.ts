import type { PermixDefinition, PermixRules } from './createPermix'
import { isRulesValid } from './utils'

/**
 * Define permissions in different place to setup them later.
 *
 * @link https://permix.letstri.dev/docs/guide/template
 *
 * @example
 * ```ts
 * // Some file where you want to define setup without permix instance
 * import { template } from 'permix'
 * import { Definition } from './permix'
 *
 * const adminPermissions = template<Definition>({
 *   post: {
 *     create: true,
 *     read: false
 *   }
 * })
 *
 * // Now you can use setup
 * permix.setup(adminPermissions())
 * ```
 */
export function template<Definition extends PermixDefinition>(rules: PermixRules<Definition>) {
  if (!isRulesValid(rules)) {
    throw new Error('[Permix]: Permissions in template are not valid.')
  }

  return () => rules
}

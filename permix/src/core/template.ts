import type { PermixDefinition, PermixRules } from './create-permix'
import { isRulesValid } from './utils'

/**
 * Builder for template function.
 *
 * @example
 * ```ts
 * const template = templator<Definition>()
 * const rules = template(({ user }: { user: { role: string } }) => ({
 *   post: { create: user.role === 'admin' },
 * }))
 */
export function templator<Definition extends PermixDefinition>() {
  return <P = void>(rules: Parameters<typeof template<Definition, P>>[0]) => template<Definition, P>(rules)
}

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
export function template<Definition extends PermixDefinition, P = void>(
  rules: PermixRules<Definition> | ((param: P) => PermixRules<Definition>),
) {
  function validate(p: PermixRules<Definition>) {
    if (!isRulesValid(p)) {
      throw new Error('[Permix]: Permissions in template are not valid.')
    }
  }

  if (typeof rules === 'function') {
    return (param: P) => {
      const p = rules(param)

      validate(p)

      return p
    }
  }

  validate(rules)

  return () => rules
}

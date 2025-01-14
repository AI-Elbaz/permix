import { hooks } from './hooks'

export type GetRules<Permissions extends Record<string, {
  dataType?: any
  action: string
}> = Record<string, {
  dataType?: any
  action: string
}>> = {
  [Key in keyof Permissions]?: {
    [Action in Permissions[Key]['action']]?:
      | boolean
      | ((data: Permissions[Key]['dataType']) => boolean);
  };
}

export type BasePermissions = Record<string, {
  dataType?: any
  action: string
}>

/**
 * Interface for the Permix permission manager
 * @example
 * ```ts
 * const permix = createPermix<{
 *   post: {
 *     dataType: { id: string }
 *     action: 'create' | 'read'
 *   }
 * }>()
 * ```
 */
export interface Permix<Permissions extends BasePermissions> {
  /**
   * Check if an action is allowed for an entity using current rules
   *
   * @example
   * ```ts
   * // Single action check
   * permix.check('post', 'create') // returns true/false
   *
   * // Multiple actions check
   * permix.check('post', ['create', 'read']) // returns true if ALL actions are allowed
   *
   * // With data
   * permix.check('post', 'read', { id: '123' })
   * ```
   */
  check: <K extends keyof Permissions>(entity: K, action: Permissions[K]['action'] | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => boolean

  /**
   * Check if an action is allowed for an entity using provided rules
   *
   * @example
   * ```ts
   * const rules = {
   *   post: {
   *     create: true,
   *     read: (data) => data.id === 'allowed-id'
   *   }
   * }
   * permix.checkWithRules(rules, 'post', 'create')
   * ```
   */
  checkWithRules: <K extends keyof Permissions>(rules: GetRules<Permissions>, entity: K, action: Permissions[K]['action'] | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => boolean

  /**
   * Set up permission rules
   *
   * @example
   * ```ts
   * // Direct rules object
   * await permix.setup({
   *   post: { create: true, read: false }
   * })
   *
   * // Async function
   * await permix.setup(async () => {
   *   const isAdmin = await checkUserRole()
   *   return {
   *     post: { create: isAdmin }
   *   }
   * })
   * ```
   */
  setup: <Rules extends GetRules<Permissions>>(callback: Rules | (() => Rules | Promise<Rules>)) => Promise<void>

  /**
   * Get current permission rules
   *
   * @example
   * ```ts
   * const rules = permix.getRules()
   * // returns { post: { create: true, read: false } }
   * ```
   */
  getRules: () => GetRules<Permissions>

  /**
   * Register event handler
   *
   * @example
   * ```ts
   * permix.on('setup', () => {
   *   console.log('Rules were updated')
   * })
   * ```
   */
  on: (event: 'setup', callback: () => Promise<void> | void) => void

  /**
   * Current rules object
   *
   * @example
   * ```ts
   * console.log(permix.$rules)
   * // { post: { create: true, read: false } }
   * ```
   */
  $rules: GetRules<Permissions>
}

/**
 * Create a Permix instance
 *
 * @example
 * ```ts
 * const permix = createPermix<{
 *   post: {
 *     dataType: { id: string }
 *     action: 'create' | 'read'
 *   },
 *   user: {
 *     dataType: { id: string }
 *     action: 'create' | 'read'
 *   }
 * }>()
 *
 * await permix.setup({
 *   post: { create: false },
 *   user: { read: true }
 * })
 *
 * console.log(permix.check('post', 'create')) // false
 * console.log(permix.check('user', 'read')) // true
 * ```
 */
export function createPermix<Permissions extends BasePermissions>(): Permix<Permissions> {
  let rules: GetRules<Permissions> = {}

  hooks.hook('setup', (r) => {
    rules = r as GetRules<Permissions>
  })

  return {
    checkWithRules(rules, entity, action, data) {
      const entityObj = rules[entity]

      if (process.env.NODE_ENV === 'development' && !entityObj) {
        console.warn(`[Permix] Entity not found: "${String(entity)}". This warning is only shown in development mode.`)
      }

      const actionValues = (Array.isArray(action) ? action.map(a => entityObj?.[a]) : [entityObj?.[action]])

      if (process.env.NODE_ENV === 'development' && actionValues.length === 0) {
        console.warn(`[Permix] Action not found: "${String(action)}" for entity "${String(entity)}". This warning is only shown in development mode.`)
      }

      return actionValues.every((action) => {
        if (typeof action === 'function') {
          return action(data) ?? false
        }

        return action ?? false
      })
    },
    check(entity, action, data) {
      return this.checkWithRules(rules, entity, action, data)
    },
    async setup(rules) {
      await hooks.callHook('setup', typeof rules === 'function' ? await rules() : rules)
    },
    getRules: () => rules,
    on(event, callback) {
      hooks.hook(event, callback)
    },
    $rules: rules,
  } satisfies Permix<Permissions>
}

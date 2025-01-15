import { hooks } from './hooks'

export type PermixRules<Permissions extends Record<string, {
  dataType?: unknown
  action: string
}> = Record<string, {
  dataType?: unknown
  action: string
}>> = {
  [Key in keyof Permissions]: {
    [Action in Permissions[Key]['action']]:
      | boolean
      | ((data: Permissions[Key]['dataType']) => boolean);
  };
}

export interface PermixPermission<T = unknown> {
  dataType?: T
  action: string
}

export type PermixPermissions = Record<string, PermixPermission>

export interface PermixOptions<Permissions extends PermixPermissions> {
  initialRules?: PermixRules<Permissions>
}

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
export interface Permix<Permissions extends PermixPermissions> {
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
  check: <K extends keyof Permissions>(entity: K, action: 'all' | Permissions[K]['action'] | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => boolean

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
  checkWithRules: <K extends keyof Permissions>(rules: PermixRules<Permissions>, entity: K, action: Permissions[K]['action'] | 'all' | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => boolean

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
  setup: <Rules extends PermixRules<Permissions>>(callback: Rules | (() => Rules | Promise<Rules>)) => Promise<void>

  /**
   * Get current permission rules
   *
   * @example
   * ```ts
   * const rules = permix.getRules()
   * // returns { post: { create: true, read: false } }
   * ```
   */
  getRules: () => PermixRules<Permissions>

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
  $rules: PermixRules<Permissions>
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
export function createPermix<Permissions extends PermixPermissions>(options: PermixOptions<Permissions> = {}): Permix<Permissions> {
  let rules: PermixRules<Permissions> | null = options.initialRules ?? null

  hooks.hook('setup', (r) => {
    rules = r as PermixRules<Permissions>
  })

  return {
    checkWithRules(rules, entity, action, data) {
      if (!rules) {
        throw new Error('[Permix]: Looks like you forgot to setup the rules')
      }

      if (!rules[entity]) {
        throw new Error(`[Permix]: Looks like you forgot to setup the rules for "${String(entity)}"`)
      }

      const entityObj = rules[entity]
      const actions = Array.isArray(action) ? action : [action]
      const isEveryActionDefined = actions.every(a => entityObj[a] !== undefined || action === 'all')

      if (!isEveryActionDefined) {
        throw new Error(`[Permix]: Permission "${String(action)}" is not defined for "${String(entity)}"`)
      }

      const actionValues = action === 'all'
        ? Object.values(entityObj)
        : actions.map(a => entityObj[a])

      return actionValues.every((action) => {
        if (typeof action === 'function') {
          return action(data) ?? false
        }

        return action ?? false
      })
    },
    check(entity, action, data) {
      return this.checkWithRules(rules!, entity, action, data)
    },
    async setup(rules) {
      await hooks.callHook('setup', typeof rules === 'function' ? await rules() : rules)
    },
    getRules: () => {
      if (!rules) {
        throw new Error('[Permix]: Looks like you forgot to setup the rules')
      }

      return rules
    },
    on(event, callback) {
      hooks.hook(event, callback)
    },
    $rules: {} as PermixRules<Permissions>,
  } satisfies Permix<Permissions>
}

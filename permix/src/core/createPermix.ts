import { hooks } from './hooks'
import { isPermissionsValid, isPermissionsValidJson } from './utils'

export interface PermixPermission<T = unknown> {
  dataType?: T
  action: string
}

export type PermixPermissions = Record<string, PermixPermission>

export type PermixJSON<Permissions extends PermixPermissions = PermixPermissions> = {
  [Key in keyof Permissions]: {
    [Action in Permissions[Key]['action']]:
      | boolean
  };
}

export type PermixSetup<Permissions extends PermixPermissions = PermixPermissions> = {
  [Key in keyof Permissions]: {
    [Action in Permissions[Key]['action']]:
      | boolean
      | ((data: Permissions[Key]['dataType']) => boolean);
  };
}

export interface PermixOptions<Permissions extends PermixPermissions> {
  /**
   * Initial permissions object.
   *
   * @description
   * Useful if you want to setup immediately all permissions before `setup` method.
   * But do not forget to call `setup` method after that.
   *
   * @example
   * ```ts
   * const permix = createPermix<{
   *   post: {
   *     dataType: { id: string }
   *     action: 'create' | 'read'
   *   }
   * }>({
   *   post: { create: true, read: false }
   * })
   *
   * await permix.setup({
   *   post: { create: true, read: false }
   * })
   * ```
   */
  initialPermissions?: PermixJSON<Permissions>
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
   * Check if an action is allowed for an entity using current permissions
   *
   * @example
   * ```ts
   * // Single action check
   * permix.check('post', 'create') // returns true if allowed
   *
   * // Multiple actions check
   * permix.check('post', ['create', 'read']) // returns true if both actions are allowed
   *
   * // With data
   * permix.check('post', 'read', { id: '123' }) // returns true if allowed exactly with this post
   *
   * // All actions check
   * permix.check('post', 'all') // returns true if ALL actions are allowed
   * ```
   */
  check: <K extends keyof Permissions>(entity: K, action: 'all' | Permissions[K]['action'] | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => boolean

  /**
   * Set up permissions
   *
   * @example
   * ```ts
   * // Direct permissions object
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
  setup: <Rules extends PermixSetup<Permissions>>(callback: Rules | (() => Rules | Promise<Rules>)) => Promise<void>

  /**
   * Get current permissions in JSON format
   *
   * @example
   * ```ts
   * permix.setup({
   *   post: { create: true, delete: post => !post.isPublished }
   * })
   * const permissions = permix.getJSON()
   * // returns { post: { create: true, delete: false } }
   * ```
   */
  getJSON: () => PermixJSON<Permissions> | null

  /**
   * Register event handler
   *
   * @example
   * ```ts
   * permix.on('setup', () => {
   *   console.log('Permissions were updated')
   * })
   * ```
   */
  on: (event: 'setup', callback: () => Promise<void> | void) => void

  /**
   * Define permissions in different place to setup them later
   *
   * @example
   * ```ts
   * // Some file where you want to define setup without permix instance
   * import { permix } from './permix'
   *
   * const adminPermissions = permix.definePermissions({
   *   post: {
   *     create: true,
   *     read: false
   *   }
   * })
   *
   * // Now you can use setup
   * await permix.setup(adminPermissions)
   * ```
   */
  definePermissions: (permissions: PermixSetup<Permissions>) => PermixSetup<Permissions>
}

export interface PermixInternal<Permissions extends PermixPermissions> extends Permix<Permissions> {
  /**
   * @internal
   */
  _: {
    /**
     * Get latest setup state
     *
     * @example
     * ```ts
     * await permix.setup({
     *   post: { create: true, delete: post => !post.isPublished }
     * })
     * const permissions = permix._.getPermissions()
     * // returns { post: { create: true, delete: post => !post.isPublished } }
     * ```
     */
    getPermissions: () => PermixSetup<Permissions>
    /**
     * Check if an action is allowed for an entity using provided permissions
     *
     * @example
     * ```ts
     * permix._.checkWithPermissions(permix._.getPermissions(), 'post', 'create')
     * ```
     */
    checkWithPermissions: <K extends keyof Permissions>(setup: PermixSetup<Permissions>, entity: K, action: Permissions[K]['action'] | 'all' | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => boolean
  }
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
  if (options.initialPermissions && !isPermissionsValidJson(options.initialPermissions)) {
    throw new Error('[Permix]: Initial permissions are not valid JSON.')
  }

  let permissions: Partial<PermixSetup<Permissions>> = options.initialPermissions ?? {}

  hooks.hook('setup', (r) => {
    permissions = r as PermixSetup<Permissions>
  })

  const permix = {
    check(entity, action, data) {
      return this._.checkWithPermissions(permissions as PermixSetup<Permissions>, entity, action, data)
    },
    async setup(permissions) {
      await hooks.callHook('setup', typeof permissions === 'function' ? await permissions() : permissions)
    },
    getJSON: () => {
      const processedSetup = {} as PermixJSON<Permissions>
      for (const entity in permissions) {
        processedSetup[entity] = {} as any
        for (const action in permissions[entity]) {
          const value = permissions[entity][action]
          processedSetup[entity][action] = typeof value === 'function' ? false : value as boolean
        }
      }
      return processedSetup
    },
    on(event, callback) {
      hooks.hook(event, callback)
    },
    definePermissions: (permissions) => {
      if (!isPermissionsValid(permissions)) {
        throw new Error('[Permix]: Permissions are not valid.')
      }

      return permissions
    },
    _: {
      getPermissions: () => {
        return permissions as PermixSetup<Permissions>
      },
      checkWithPermissions(permissions, entity, action, data) {
        if (!permissions) {
          console.error('[Permix]: Permissions were not defined. Check if you have called `setup` method before using any `check` method.')
        }

        if (!permissions[entity]) {
          console.warn(`[Permix]: Permissions for entity "${String(entity)}" is not defined.`)
        }

        const entityObj = permissions[entity] ?? {}
        const actions = Array.isArray(action) ? action : [action]
        const isEveryActionDefined = actions.every(a => entityObj[a] !== undefined || action === 'all')

        if (!isEveryActionDefined) {
          console.warn(`[Permix]: Permissions for entity "${String(entity)}" was defined, but some actions are missing.`)
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
    },
  } satisfies PermixInternal<Permissions>

  return permix as Permix<Permissions>
}

export const createPermixInternal = createPermix as <Permissions extends PermixPermissions>(options?: PermixOptions<Permissions>) => PermixInternal<Permissions>

import { hooks } from './hooks'
import { isPermissionsValid } from './utils'

export type PermixDefinition = Record<string, {
  dataType?: unknown
  action: string
}>

const permixSymbol = Symbol.for('permix')

export type PermixJSON<Permissions extends PermixDefinition = PermixDefinition> = {
  [Key in keyof Permissions]: {
    [Action in Permissions[Key]['action']]:
      | boolean
  };
}

export type PermixState<Permissions extends PermixDefinition = PermixDefinition> = {
  [Key in keyof Permissions]: {
    [Action in Permissions[Key]['action']]:
      | boolean
      | ((data: Permissions[Key]['dataType']) => boolean);
  };
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
export interface Permix<Permissions extends PermixDefinition> {
  /**
   * Check if an action is allowed for an entity using current permissions.
   *
   * @link https://permix.letstri.dev/docs/guide/check
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
   * Similar to `check`, but returns a Promise that resolves once `setup` is called.
   * This ensures permissions are ready before checking them.
   *
   * @link https://permix.letstri.dev/docs/guide/check
   *
   * @example
   * ```ts
   * // Wait for permissions to be ready
   * const canCreate = await permix.checkAsync('post', 'create') // Promise<true>
   *
   * // Multiple actions
   * const canCreateAndRead = await permix.checkAsync('post', ['create', 'read'])
   *
   * // Even if you call setup after checking
   * await permix.setup({ post: { create: true } })
   * const canCreate = await permix.checkAsync('post', 'create') // Promise<true>
   * ```
   */
  checkAsync: <K extends keyof Permissions>(entity: K, action: 'all' | Permissions[K]['action'] | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => Promise<boolean>

  /**
   * Set up permissions.
   *
   * @link https://permix.letstri.dev/docs/guide/setup
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
  setup: <Rules extends PermixState<Permissions>>(callback: Rules | (() => (Rules | Promise<Rules>))) => Promise<void>

  /**
   * Register event handler.
   *
   * @link https://permix.letstri.dev/docs/guide/events
   *
   * @returns Function to remove the hook
   *
   * @example
   * ```ts
   * permix.on('setup', () => {
   *   console.log('Permissions were updated')
   * })
   * ```
   */
  hook: (event: 'setup', callback: () => Promise<void> | void) => () => void

  /**
   * Similar to `hook`, but will be called only once.
   *
   * @returns Function to remove the hook
   *
   * @example
   * ```ts
   * permix.hookOnce('setup', () => {
   *   console.log('Permissions were updated')
   * })
   * ```
   */
  hookOnce: (event: 'setup', callback: () => Promise<void> | void) => () => void

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
   * await permix.setup(adminPermissions)
   * ```
   */
  template: <T = void>(permissions: PermixState<Permissions> | ((param: T) => PermixState<Permissions>)) => (param: T) => PermixState<Permissions>

  [permixSymbol]: true
}

export interface PermixInternal<Permissions extends PermixDefinition> extends Permix<Permissions> {
  /**
   * @internal
   */
  _: {
    /**
     * Check if the setup was called
     */
    isReady: boolean

    /**
     * Get latest setup state
     *
     * @example
     * ```ts
     * await permix.setup({
     *   post: { create: true, delete: post => !post.isPublished }
     * })
     * const permissions = permix._.getState()
     * // returns { post: { create: true, delete: post => !post.isPublished } }
     * ```
     */
    getState: () => PermixState<Permissions>

    /**
     * Set new permissions state
     *
     * @example
     * ```ts
     * permix._.setState({ post: { create: true, delete: post => !post.isPublished } })
     * ```
     */
    setState: (state: PermixState<Permissions>) => void

    /**
     * Check if an action is allowed for an entity using provided permissions
     *
     * @example
     * ```ts
     * permix._.checkWithState(permix._.getState(), 'post', 'create')
     * ```
     */
    checkWithState: <K extends keyof Permissions>(state: PermixState<Permissions>, entity: K, action: Permissions[K]['action'] | 'all' | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => boolean

    /**
     * Get current permissions in JSON format
     *
     * @example
     * ```ts
     * permix.setup({
     *   post: { create: true, delete: post => !post.isPublished }
     * })
     * const permissions = permix.getStateJSON()
     * // returns { post: { create: true, delete: false } }
     * ```
     */
    getStateJSON: () => PermixJSON<Permissions>
  }
}

/**
 * Create a Permix instance
 *
 * @link https://permix.letstri.dev/docs/guide/instance
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
export function createPermix<Permissions extends PermixDefinition>(): Permix<Permissions> {
  let state: Partial<PermixState<Permissions>> = {}
  let isReady = false
  let resolve: () => void

  const _promise = new Promise((res) => {
    resolve = () => res(undefined)
  })

  hooks.hook('setup', (r) => {
    state = r as PermixState<Permissions>
    isReady = true
    resolve()
  })

  const permix = {
    check(entity, action, data) {
      return this._.checkWithState(state as PermixState<Permissions>, entity, action, data)
    },
    async checkAsync(entity, action, data) {
      await _promise

      return this._.checkWithState(state as PermixState<Permissions>, entity, action, data)
    },
    async setup(permissions) {
      await hooks.callHook('setup', typeof permissions === 'function' ? await permissions() : permissions)
    },
    hook: hooks.hook,
    hookOnce: hooks.hookOnce,
    template: (permissions) => {
      function validate(p: PermixState<Permissions>) {
        if (!isPermissionsValid(p)) {
          throw new Error('[Permix]: Permissions in template are not valid.')
        }
      }

      if (typeof permissions !== 'function') {
        validate(permissions)
      }

      if (typeof permissions === 'function') {
        return (param) => {
          const p = permissions(param)

          validate(p)

          return p
        }
      }

      return () => permissions
    },
    [permixSymbol]: true,
    _: {
      isReady,
      getState: () => {
        return state as PermixState<Permissions>
      },
      getStateJSON: () => {
        const processedSetup = {} as PermixJSON<Permissions>
        for (const entity in state) {
          processedSetup[entity] = {} as any
          for (const action in state[entity]) {
            const value = state[entity][action]
            processedSetup[entity][action] = typeof value === 'function' ? false : value as boolean
          }
        }
        return processedSetup
      },
      setState(s) {
        state = s as PermixState<Permissions>
      },
      checkWithState(state, entity, action, data) {
        if (!state[entity]) {
          return false
        }

        const entityObj = state[entity]
        const actions = Array.isArray(action) ? action : [action]

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

export function validatePermix<Permissions extends PermixDefinition>(permix: Permix<Permissions>): asserts permix is PermixInternal<Permissions> {
  if (!(permix as PermixInternal<Permissions>)[permixSymbol]) {
    throw new Error('[Permix]: Permix is not valid')
  }
}

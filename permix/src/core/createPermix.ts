import { hooks } from './hooks'

export type GetRules<Permissions extends Record<string, {
  dataType: any
  action: string
}> = Record<string, {
  dataType: any
  action: string
}>> = {
  [Key in keyof Permissions]?: {
    [Action in Permissions[Key]['action']]?:
      | boolean
      | ((data: Permissions[Key]['dataType']) => boolean);
  };
}

export type BasePermissions = Record<string, {
  dataType: any
  action: string
}>

export interface Permix<Permissions extends BasePermissions> {
  check: <K extends keyof Permissions>(entity: K, action: Permissions[K]['action'] | Permissions[K]['action'][], data?: Permissions[K]['dataType']) => boolean
  setup: <Rules extends GetRules<Permissions>>(callback: Rules | (() => Rules | Promise<Rules>)) => Promise<void>
  getRules: () => GetRules<Permissions>
  on: (event: 'setup', callback: () => Promise<void> | void) => void
  $rules: GetRules<Permissions>
}

export function createPermix<Permissions extends BasePermissions>(): Permix<Permissions> {
  let rules: GetRules<Permissions> = {}

  hooks.hook('setup', (r) => {
    rules = r as GetRules<Permissions>
  })

  return {
    check(entity, action, data) {
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

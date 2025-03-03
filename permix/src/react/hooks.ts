import type { Permix, PermixDefinition, PermixRules } from '../core/create-permix'
import * as React from 'react'
import { checkWithRules, getRules, validatePermix } from '../core/create-permix'

export const Context = React.createContext<{
  permix: Permix<any>
  isReady: boolean
  state: PermixRules<any>
}>(null!)

export function usePermixContext() {
  const context = React.useContext(Context)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to wrap your app with <PermixProvider>')
  }

  return context
}

/**
 * Hook that provides the Permix reactive methods to your React components.
 *
 * @link https://permix.letstri.dev/docs/integrations/react
 */

export function usePermix<T extends PermixDefinition>(
  permix: Permix<T>,
) {
  validatePermix(permix)

  const { permix: permixContext, isReady, state } = usePermixContext()

  validatePermix(permixContext)

  const check: typeof permix.check = React.useCallback((entity, action, data) => {
    return checkWithRules(state ?? getRules(permixContext), entity, action, data)
  }, [permixContext, state])

  return { check, isReady }
}

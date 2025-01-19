import * as React from 'react'
import { type Permix, type PermixDefinition, type PermixState, validatePermix } from '../core/createPermix'

export const PermixContext = React.createContext<{ state: PermixState<any>, isReady: boolean }>(null!)

/**
 * Provider that provides the Permix context to your React components.
 *
 * @link https://permix.letstri.dev/docs/integrations/react
 */
export function PermixProvider<Permissions extends PermixDefinition>({
  children,
  permix,
}: { children: React.ReactNode, permix: Permix<Permissions> }) {
  validatePermix(permix)

  const [setup, setSetup] = React.useState({ state: permix._.getState(), isReady: permix._.isReady })

  React.useEffect(() => {
    return permix.hook('setup', () => {
      setSetup({ state: permix._.getState(), isReady: true })
    })
  }, [permix])

  return (
    // eslint-disable-next-line react/no-context-provider
    <PermixContext.Provider value={setup}>
      {children}
    </PermixContext.Provider>
  )
}

/**
 * Hook that provides the Permix context to your React components.
 *
 * @link https://permix.letstri.dev/docs/integrations/react
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePermix<T extends PermixDefinition>(
  permix: Permix<T>,
) {
  validatePermix(permix)

  const context = React.useContext(PermixContext)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to wrap your app with <PermixProvider>')
  }

  const check: typeof permix.check = React.useCallback((entity, action, data) => {
    return permix._.checkWithState(context.state, entity, action, data)
  }, [context.state, permix])

  return { check, isReady: context.isReady }
}

import type { Permix, PermixDefinition, PermixState } from '../core/createPermix'
import * as React from 'react'
import { validatePermix } from '../core/createPermix'

// eslint-disable-next-line react-refresh/only-export-components
export const PermixContext = React.createContext<{
  permix: Permix<any>
  isReady: boolean
  state: PermixState<any>
}>(null!)

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

  const [permixLocal, setPermixLocal] = React.useState(permix)
  const [isReady, setIsReady] = React.useState(permix._.isReady)
  const [state, setState] = React.useState(permix._.getState())

  React.useEffect(() => {
    return permix.hook('setup', () => {
      setPermixLocal(permix)
      if (!isReady)
        setIsReady(true)
      setState(permix._.getState())
    })
  }, [permix])

  const value = React.useMemo(() => ({ permix: permixLocal, isReady, state }), [permixLocal, isReady, state])

  return (
    // eslint-disable-next-line react/no-context-provider
    <PermixContext.Provider value={value}>
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

  const { permix: permixContext, isReady, state } = context

  validatePermix(permixContext)

  const check: typeof permix.check = React.useCallback((entity, action, data) => {
    return permix._.checkWithState(state, entity, action, data)
  }, [state, permix])

  return { check, isReady }
}

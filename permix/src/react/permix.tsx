import type { Permix, PermixDefinition, PermixState, PermixStateJSON } from '../core/createPermix'
import * as React from 'react'
import { hydrate } from '../core'
import { validatePermix } from '../core/createPermix'

const PermixContext = React.createContext<{
  permix: Permix<any>
  isReady: boolean
  state: PermixState<any>
}>(null!)

function usePermixContext() {
  const context = React.useContext(PermixContext)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to wrap your app with <PermixProvider>')
  }

  return context
}

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

  const [context, setContext] = React.useState({
    permix,
    isReady: false,
    state: permix._.getState(),
  })

  React.useEffect(() => {
    return permix.hook('setup', () => {
      setContext(c => ({ ...c, state: permix._.getState() }))
    })
  }, [permix])

  React.useEffect(() => {
    return permix.hook('ready', () => {
      setContext(c => ({ ...c, isReady: true }))
    })
  }, [permix])

  return (
    // eslint-disable-next-line react/no-context-provider
    <PermixContext.Provider value={context}>
      {children}
    </PermixContext.Provider>
  )
}

/**
 * Hook that provides the Permix reactive methods to your React components.
 *
 * @link https://permix.letstri.dev/docs/integrations/react
 */
// eslint-disable-next-line react-refresh/only-export-components
export function usePermix<T extends PermixDefinition>(
  permix: Permix<T>,
) {
  validatePermix(permix)

  const { permix: permixContext, isReady, state } = usePermixContext()

  validatePermix(permixContext)

  const check: typeof permixContext.check = React.useCallback((entity, action, data) => {
    return permixContext._.checkWithState(state ?? permixContext._.getState(), entity, action, data)
  }, [permixContext, state])

  return { check, isReady }
}

export function PermixHydrate({ children, state }: { children: React.ReactNode, state: PermixStateJSON<any> }) {
  const { permix } = usePermixContext()

  validatePermix(permix)

  React.useMemo(() => hydrate(permix, state), [permix, state])

  return children
}

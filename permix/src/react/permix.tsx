import type { Permix, PermixDefinition, PermixState, PermixStateJSON } from '../core/createPermix'
import * as React from 'react'
import { hydrate } from '../core'
import { validatePermix } from '../core/createPermix'

interface Context {
  permix: Permix<any>
  isReady: boolean
  state: PermixState<any>
}

const PermixContext = React.createContext<Context>(null!)

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

  const [context, setContext] = React.useState<Context>({
    permix,
    isReady: permix._.isReady(),
    state: permix._.getState(),
  })

  React.useEffect(() => {
    return permix.hook('setup', () => {
      setContext(c => ({ ...c, isReady: permix._.isReady(), state: permix._.getState() }))
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
 * Hook that provides the Permix context to your React components.
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

  const check: typeof permix.check = React.useCallback((entity, action, data) => {
    return permix._.checkWithState(state, entity, action, data)
  }, [state, permix])

  return { check, isReady }
}

export function PermixHydrate({ children, state }: { children: React.ReactNode, state: PermixStateJSON<any> }) {
  const { permix } = usePermixContext()

  validatePermix(permix)

  // Thanks TanStack Query for this trick: https://github.com/TanStack/query/blob/main/packages/react-query/src/HydrationBoundary.tsx#L56
  React.useMemo(() => {
    hydrate(permix, state)
  }, [permix, state])

  return children
}

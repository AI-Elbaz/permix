import type { Permix, PermixDefinition, PermixInternal, PermixSetup } from '../core/createPermix'
import * as React from 'react'

const PermixContext = React.createContext<{ permissions: PermixSetup<any>, isReady: boolean } | null>(null)

export function PermixProvider<Permissions extends PermixDefinition>({
  children,
  permix,
}: { children: React.ReactNode, permix: Permix<Permissions> }) {
  const _permix = permix as PermixInternal<any>
  const [setup, setSetup] = React.useState({ permissions: _permix._.getPermissions(), isReady: _permix._.isReady })

  React.useEffect(() => {
    _permix.on('setup', () => {
      setSetup({ permissions: _permix._.getPermissions(), isReady: true })
    })
  }, [_permix])

  return (
    // eslint-disable-next-line react/no-context-provider
    <PermixContext.Provider value={setup}>
      {children}
    </PermixContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePermix<T extends PermixDefinition>(
  permix: Permix<T>,
) {
  const _permix = permix as PermixInternal<any>
  const context = React.useContext(PermixContext)

  if (!context) {
    throw new Error('[Permix]: Looks like you forgot to wrap your app with <PermixProvider>')
  }

  const check: typeof permix.check = React.useCallback((entity, action, data) => {
    return _permix._.checkWithPermissions(context.permissions, entity, action, data)
  }, [context.permissions, _permix])

  return { check, isReady: context.isReady }
}

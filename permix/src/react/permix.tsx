import type { Permix, PermixInternal, PermixPermissions, PermixSetup } from '../core/createPermix'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const PermixContext = createContext<PermixSetup<any> | null>(null)

export function PermixProvider({
  children,
  permix,
}: { children: React.ReactNode, permix: Permix<any> }) {
  const _permix = permix as PermixInternal<any>
  const [setup, setSetup] = useState(_permix._.getSetup())

  useEffect(() => {
    _permix.on('setup', () => {
      setSetup(_permix._.getSetup())
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
export function usePermix<T extends PermixPermissions>(
  permix: Permix<T>,
) {
  const _permix = permix as PermixInternal<any>
  const setup = useContext(PermixContext)

  if (!setup) {
    throw new Error('[Permix]: Looks like you forgot to wrap your app with <PermixProvider>')
  }

  const check: typeof permix.check = useCallback((entity, action, data) => {
    return _permix._.checkWithSetup(setup, entity, action, data)
  }, [setup, _permix])

  return { check }
}

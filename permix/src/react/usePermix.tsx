'use client'

import type { Permix, PermixPermissions, PermixRules } from '../core/createPermix'
import { createContext, useCallback, useContext, useEffect, useState } from 'react'

const PermixContext = createContext<PermixRules<any> | null>(null)

export function PermixProvider({ children, permix }: { children: React.ReactNode, permix: Permix<any> }) {
  const [rules, setRules] = useState(permix.getRules())

  useEffect(() => {
    permix.on('setup', () => {
      setRules(permix.getRules())
    })
  }, [permix])

  return (
    // eslint-disable-next-line react/no-context-provider
    <PermixContext.Provider value={rules}>
      {children}
    </PermixContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePermix<T extends PermixPermissions>(
  permix: Permix<T>,
) {
  const rules = useContext(PermixContext)

  if (!rules) {
    throw new Error('[Permix]: Looks like you forgot to wrap your app with <PermixProvider>')
  }

  const check = useCallback(
    <K extends keyof T>(entity: K, action: T[K]['action']) => {
      return permix.checkWithRules(rules, entity, action)
    },
    [rules, permix],
  )

  return { check }
}

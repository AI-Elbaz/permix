'use client'

import type { BasePermissions, Permix } from '../core/createPermix'
import { useCallback, useEffect, useState } from 'react'

export function usePermix<T extends BasePermissions>(
  permix: Permix<T>,
) {
  const [rules, setRules] = useState(permix.getRules())

  useEffect(() => {
    permix.on('setup', async () => {
      setRules(permix.getRules())
    })
  }, [permix])

  const check = useCallback(
    <K extends keyof T>(entity: K, action: T[K]['action']) => {
      return permix.checkWithRules(rules, entity, action)
    },
    [rules],
  )

  return { check }
}

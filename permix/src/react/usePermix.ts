'use client'

import type { Permix } from '../core/createPermix'
import { useCallback, useEffect, useState } from 'react'

export function usePermix<T extends Record<string, { dataType: any, action: string }>>(
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

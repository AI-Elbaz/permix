import type { Permix } from '../core/createPermix'
import { useCallback } from 'react'

export function usePermix<T extends Record<string, { dataType: any, action: string }>>(
  permix: Permix<T>,
) {
  const check = useCallback(
    <K extends keyof T>(entity: K, action: T[K]['action']) => {
      return permix.check(entity, action)
    },
    [permix],
  )

  return { check }
}

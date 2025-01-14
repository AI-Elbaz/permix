import type { Permix } from '../core/createPermix'

export function usePermix<T extends Record<string, { dataType: any, action: string }>>(
  permix: Permix<T>,
) {
  const check = <K extends keyof T>(entity: K, action: T[K]['action']) => {
    return permix.check(entity, action)
  }

  return { check }
}

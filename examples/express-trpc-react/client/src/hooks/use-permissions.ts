import { permix } from '@/shared/permix'
import { usePermix } from 'permix/react'

export function usePermissions() {
  return usePermix(permix)
}

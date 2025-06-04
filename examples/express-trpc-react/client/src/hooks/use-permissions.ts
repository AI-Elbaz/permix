import { usePermix } from 'permix/react'
import { permix } from '@/shared/permix'

export function usePermissions() {
  return usePermix(permix)
}

import { permix } from '@/lib/permix'
import { usePermix } from 'permix/react'

export function usePermissions() {
  return usePermix(permix)
}

import type { PermixDefinition } from 'permix'
import { template } from 'permix'

export type PermissionsDefinition = PermixDefinition<{
  user: {
    action: 'read' | 'create'
  }
}>

const adminPermissions = template<PermissionsDefinition>({
  user: {
    read: true,
    create: true,
  },
})

const userPermissions = template<PermissionsDefinition>({
  user: {
    read: true,
    create: false,
  },
})

export function getRules(role: 'admin' | 'user') {
  const rolesMap = {
    admin: () => adminPermissions(),
    user: () => userPermissions(),
  }

  return rolesMap[role]()
}

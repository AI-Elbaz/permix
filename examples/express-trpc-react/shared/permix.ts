import type { PermixDefinition } from 'permix'
import { createTemplateBuilder } from 'permix'

export type PermissionsDefinition = PermixDefinition<{
  user: {
    action: 'read' | 'create'
  }
}>

const template = createTemplateBuilder<PermissionsDefinition>()

const adminPermissions = template({
  user: {
    read: true,
    create: true,
  },
})

const userPermissions = template({
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

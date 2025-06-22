import type { PermixDefinition, PermixRules } from 'permix'

export type PermissionsDefinition = PermixDefinition<{
  user: {
    action: 'read' | 'create'
  }
}>

const adminPermissions: PermixRules<PermissionsDefinition> = {
  user: {
    read: true,
    create: true,
  },
}

const userPermissions: PermixRules<PermissionsDefinition> = {
  user: {
    read: true,
    create: false,
  },
}

export function getRules(role: 'admin' | 'user') {
  const rolesMap = {
    admin: adminPermissions,
    user: userPermissions,
  }

  return rolesMap[role]
}

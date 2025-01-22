import { createPermix } from 'permix'

export const permix = createPermix<{
  user: {
    action: 'read' | 'create'
  }
}>()

const adminPermissions = permix.template({
  user: {
    read: true,
    create: true,
  },
})

const userPermissions = permix.template({
  user: {
    read: true,
    create: false,
  },
})

export function setupPermix(role: 'admin' | 'user') {
  const rolesMap = {
    admin: () => adminPermissions(),
    user: () => userPermissions(),
  }

  return permix.setup(rolesMap[role]())
}

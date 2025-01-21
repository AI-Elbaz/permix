import { createPermix } from 'permix'

export const permix = createPermix<{
  post: {
    action: 'create' | 'read'
  }
}>()

export function setupPermix() {
  permix.setup({
    post: {
      create: true,
      read: true,
    },
  })
}

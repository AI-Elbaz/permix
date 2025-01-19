import { createPermix } from 'permix'

export const permix = createPermix<{
  post: {
    action: 'create' | 'read'
  }
}>()

export async function setupPermix() {
  await permix.setup({
    post: {
      create: true,
      read: true,
    },
  })
}

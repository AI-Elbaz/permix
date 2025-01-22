import { createPermix } from 'permix'
import { createComponents } from 'permix/vue'

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

export const { Check } = createComponents(permix)

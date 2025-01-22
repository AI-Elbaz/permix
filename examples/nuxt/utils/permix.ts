import { createPermix } from 'permix'
import { createComponents } from 'permix/vue'

export const permix = createPermix<{
  post: {
    action: 'create' | 'read'
  }
  comment: {
    action: 'create' | 'update'
  }
}>()

export function setupPermix() {
  permix.setup({
    post: {
      create: true,
      read: true,
    },
    comment: {
      create: true,
      update: true,
    },
  })
}

export const { Check } = createComponents(permix)

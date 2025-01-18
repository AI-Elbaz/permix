import { createPermix } from 'permix'

export const permix = createPermix<{
  post: {
    action: 'create' | 'read' | 'update' | 'delete'
  }
  comment: {
    action: 'create' | 'read' | 'update' | 'delete'
  }
}>()

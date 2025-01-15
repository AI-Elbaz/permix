import { createPermix } from 'permix'

export interface Post {
  id: string
  title: string
  authorId: string
}

export interface User {
  id: string
  name: string
  role: 'admin' | 'user'
}

export const permix = createPermix<{
  post: {
    dataType: Post
    action: 'create' | 'update' | 'delete'
  }
  user: {
    dataType: User
    action: 'create' | 'update' | 'delete'
  }
}>()

export async function setupPermix(role: 'admin' | 'user') {
  await permix.setup({
    post: {
      create: true,
    },
    user: {
      delete: role === 'admin',
    },
  })

  return permix
}

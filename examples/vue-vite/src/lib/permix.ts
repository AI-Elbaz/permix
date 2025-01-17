import type { Post } from '../composables/posts'
import type { User } from '../composables/user'
import { createPermix } from 'permix'

export const permix = createPermix<{
  post: {
    dataType: Post
    action: 'read' | 'edit'
  }
}>()

export async function setupPermix(user: User) {
  return permix.setup({
    post: {
      read: true,
      edit: post => post.authorId === user.id,
    },
  })
}

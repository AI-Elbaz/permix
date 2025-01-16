import type { PermixInternal } from './createPermix'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPermix, createPermixInternal } from './createPermix'

interface Post {
  id: string
  title: string
  authorId: string
}

let permix: PermixInternal<{
  post: {
    dataType: Post
    action: 'create' | 'read' | 'update'
  }
}>

describe('createPermixInternal', () => {
  beforeEach(() => {
    permix = createPermixInternal<{
      post: {
        dataType: Post
        action: 'create' | 'read' | 'update'
      }
    }>()
  })

  it('should be defined', () => {
    expect(createPermixInternal).toEqual(createPermix)
  })

  it('should work with getJSON', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.getJSON()).toEqual({
      post: { create: true, read: true, update: true },
    })
    expect(permix._.checkWithPermissions(permix._.getPermissions(), 'post', 'create')).toBe(true)
  })

  it('should return JSON permissions with setup', async () => {
    function validatePost(post: { id: string }) {
      return post.id === '1'
    }

    await permix.setup({
      post: {
        create: validatePost,
        read: true,
        update: true,
      },
    })

    expect(permix.getJSON()).toEqual({
      post: { create: false, read: true, update: true },
    })
    expect(permix._.getPermissions()).toEqual({
      post: { create: validatePost, read: true, update: true },
    })
  })
})

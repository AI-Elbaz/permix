import type { Permix } from './createPermix'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPermix, validatePermix } from './createPermix'

interface Post {
  id: string
  title: string
  authorId: string
}

let permix: Permix<{
  post: {
    dataType: Post
    action: 'create' | 'read' | 'update'
  }
}>

describe('createPermixInternal', () => {
  beforeEach(() => {
    permix = createPermix<{
      post: {
        dataType: Post
        action: 'create' | 'read' | 'update'
      }
    }>()
  })

  it('should validate internal permix', () => {
    expect(() => validatePermix(permix)).not.toThrow()
  })

  it('should throw error if permix is not valid', () => {
    expect(() => validatePermix({} as Permix<{ post: { action: 'create' } }>)).toThrow()
  })

  it('should work with getStateJSON', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })

    validatePermix(permix)

    expect(permix._.getStateJSON()).toEqual({
      post: { create: true, read: true, update: true },
    })
    expect(permix._.checkWithState(permix._.getState(), 'post', 'create')).toBe(true)
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

    validatePermix(permix)

    expect(permix._.getStateJSON()).toEqual({
      post: { create: false, read: true, update: true },
    })
    expect(permix._.getState()).toEqual({
      post: { create: validatePost, read: true, update: true },
    })
  })

  it('should set new state', () => {
    validatePermix(permix)

    permix._.setState({ post: { create: true, read: true, update: true } })
    expect(permix._.getState()).toEqual({ post: { create: true, read: true, update: true } })
  })

  it('should set new state with functions', () => {
    validatePermix(permix)

    function validatePost(post: { id: string }) {
      return post.id === '1'
    }

    permix._.setState({ post: { create: true, read: true, update: validatePost } })
    expect(permix._.getState()).toEqual({ post: { create: true, read: true, update: validatePost } })
  })
})

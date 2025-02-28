import type { Permix } from '.'
import { beforeEach, describe, expect, it } from 'vitest'
import { createPermix } from '.'
import { validatePermix } from './create-permix'

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

  it('should work with getSerializableState', () => {
    permix.setup({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })

    validatePermix(permix)

    expect(permix._.getSerializableState()).toEqual({
      post: { create: true, read: true, update: true },
    })
    expect(permix._.checkWithState(permix._.getState(), 'post', 'create')).toBe(true)
  })

  it('should return JSON permissions with setup', () => {
    function validatePost(post: { id: string }) {
      return post.id === '1'
    }

    permix.setup({
      post: {
        create: validatePost,
        read: true,
        update: true,
      },
    })

    validatePermix(permix)

    expect(permix._.getSerializableState()).toEqual({
      post: { create: false, read: true, update: true },
    })
    expect(permix._.getState()).toEqual({
      post: { create: validatePost, read: true, update: true },
    })
  })
})

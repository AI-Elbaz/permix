import type { Permix } from './createPermix'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPermix } from './createPermix'

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

describe('createPermix', () => {
  beforeEach(() => {
    permix = createPermix<{
      post: {
        dataType: Post
        action: 'create' | 'read' | 'update'
      }
    }>()
  })

  it('should be defined', () => {
    expect(createPermix).toBeDefined()
  })

  it('should setup rules', async () => {
    await permix.setup({
      post: {
        create: true,
      },
    })

    expect(permix.getRules()).toEqual({
      post: {
        create: true,
      },
    })
  })

  it('shouldn\'t work if setup is no awaited', async () => {
    permix.setup({
      post: {
        create: true,
      },
    })

    expect(permix.getRules()).not.toEqual({
      post: {
        create: true,
      },
    })
  })

  it('should return true if permission is defined', async () => {
    await permix.setup({
      post: {
        create: true,
      },
    })

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should return false if permission is not defined', async () => {
    await permix.setup({
      post: {
        create: true,
      },
    })

    expect(permix.check('post', 'read')).toBe(false)
    // @ts-expect-error action is not defined
    expect(permix.check('post', 'not-exist')).toBe(false)
  })

  it('should return false if entity is not defined', async () => {
    permix.setup({
      post: {
        create: true,
      },
    })

    // @ts-expect-error entity is not defined
    expect(permix.check('comment', 'create')).toBe(false)
  })

  it('should validate permission as function', async () => {
    await permix.setup({
      post: {
        create: post => post.authorId === '1',
      },
    })

    const postWhereAuthorIdIs1 = { authorId: '1' } as Post
    const postWhereAuthorIdIs2 = { authorId: '2' } as Post

    expect(permix.check('post', 'create', postWhereAuthorIdIs1)).toBe(true)
    expect(permix.check('post', 'create', postWhereAuthorIdIs2)).toBe(false)
  })

  it('should work with setup as function', async () => {
    await permix.setup(() => ({
      post: {
        create: true,
      },
    }))

    expect(permix.getRules()).toEqual({
      post: { create: true },
    })
    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should setup async function', async () => {
    await permix.setup(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))

      return {
        post: {
          create: true,
        },
      }
    })

    expect(permix.getRules()).toEqual({
      post: { create: true },
    })
    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should work with conditionally setup async function', async () => {
    await permix.setup(async () => {
      const isAdmin = await new Promise(resolve => setTimeout(() => resolve(true), 100)) as boolean

      if (isAdmin) {
        return {
          post: {
            create: true,
          },
        }
      }

      return {
        post: {
          create: false,
        },
      }
    })

    expect(permix.getRules()).toEqual({
      post: { create: true },
    })
    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should work even if permissions are wrong', async () => {
    await permix.setup(async () => {
      const isAdmin = await new Promise(resolve => setTimeout(() => resolve(true), 100)) as boolean

      if (isAdmin) {
        return {
          post_wrong: {
            create: true,
            delete: true,
          },
        }
      }

      return {
        post: {
          create: false,
          read: true,
        },
      }
    })

    expect(permix.getRules()).toEqual({
      post_wrong: {
        create: true,
        delete: true,
      },
    })
    expect(permix.check('post', 'create')).toBe(false)
  })

  it('should call onUpdate callback', async () => {
    const callback = vi.fn()

    permix.on('setup', callback)

    await permix.setup({
      post: { create: true },
    })

    expect(callback).toHaveBeenCalled()
  })

  it('should work without dataType', async () => {
    const permix = createPermix<{
      post: {
        action: 'create'
      }
    }>()

    await permix.setup({
      post: { create: true },
    })

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should check all permissions', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.check('post', 'all')).toBe(true)

    await permix.setup({
      post: {
        create: true,
        read: false,
        update: true,
      },
    })

    expect(permix.check('post', 'all')).toBe(false)
  })
})

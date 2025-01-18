import type { Permix } from './createPermix'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPermix } from './createPermix'

interface Post {
  id: string
  title: string
  authorId: string
}

interface Comment {
  id: string
  content: string
  postId: string
}

let permix: Permix<{
  post: {
    dataType: Post
    action: 'create' | 'read'
  }
  comment: {
    dataType: Comment
    action: 'create' | 'read' | 'update'
  }
}>

describe('createPermix', () => {
  beforeEach(() => {
    permix = createPermix<{
      post: {
        dataType: Post
        action: 'create' | 'read'
      }
      comment: {
        dataType: Comment
        action: 'create' | 'read' | 'update'
      }
    }>()
  })

  it('should be defined', () => {
    expect(createPermix).toBeDefined()
  })

  it('should throw a TS error if permissions are not defined', () => {
    createPermix()
  })

  it('should setup rules', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.check('post', 'read')).toBe(true)
  })

  it('shouldn\'t work if setup is no awaited', async () => {
    permix.setup({
      post: {
        create: true,
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.check('post', 'read')).toBe(false)
  })

  it('should to be false if setup is not awaited', () => {
    expect(permix.check('post', 'read')).toBe(false)
  })

  it('should return true if permission is defined', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should return false if permission is not defined', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.check('post', 'read')).toBe(true)
    // @ts-expect-error action is not defined
    expect(permix.check('post', 'not-exist')).toBe(false)
  })

  it('should return false if entity is not defined', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
    })

    // @ts-expect-error entity is not defined
    expect(permix.check('user', 'create')).toBe(false)
  })

  it('should validate permission as function', async () => {
    await permix.setup({
      post: {
        create: post => post.authorId === '1',
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
    })

    const postWhereAuthorIdIs1 = { authorId: '1' } as Post
    const postWhereAuthorIdIs2 = { authorId: '2' } as Post

    expect(permix.check('post', 'create', postWhereAuthorIdIs1)).toBe(true)
    expect(permix.check('post', 'create', postWhereAuthorIdIs2)).toBe(false)
  })

  it('should work with async check', async () => {
    setTimeout(async () => {
      await permix.setup({
        post: {
          create: true,
          read: true,
        },
        comment: {
          create: true,
          read: true,
          update: true,
        },
      })
    }, 100)

    expect(permix.check('post', 'create')).toBe(false)
    expect(await permix.checkAsync('post', 'create')).toBe(true)

    await permix.setup({
      post: {
        create: false,
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.check('post', 'create')).toBe(false)
  })

  it('should work with setup as function', async () => {
    await permix.setup(() => ({
      post: {
        create: true,
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
    }))

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should setup async function', async () => {
    await permix.setup(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))

      return {
        post: {
          create: true,
          read: true,
        },
        comment: {
          create: true,
          read: true,
          update: true,
        },
      }
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
            read: true,
          },
          comment: {
            create: true,
            read: true,
            update: true,
          },
        }
      }

      return {
        post: {
          create: false,
          read: false,
        },
        comment: {
          create: false,
          read: false,
          update: false,
        },
      }
    })

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should call onUpdate callback', async () => {
    const callback = vi.fn()

    permix.hook('setup', callback)

    await permix.setup({
      post: {
        create: true,
        read: true,
      },
      comment: {
        create: true,
        read: true,
        update: true,
      },
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
      },
      comment: {
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
      },
      comment: {
        create: true,
        read: false,
        update: false,
      },
    })

    expect(permix.check('post', 'all')).toBe(false)
  })

  it('should define permissions with template', async () => {
    const permix = createPermix<{
      post: {
        action: 'create'
      }
    }>()

    const permissions = permix.template({
      post: {
        create: true,
      },
    })

    expect(permissions()).toEqual({
      post: {
        create: true,
      },
    })

    await permix.setup(permissions())

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should define permissions with template and param', async () => {
    const permix = createPermix<{
      post: {
        action: 'create'
      }
    }>()

    const permissions = permix.template(({ userId }: { userId: string }) => ({
      post: { create: userId === '1' },
    }))

    await permix.setup(permissions({ userId: '1' }))

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should throw an error if permissions are not valid', () => {
    expect(() => permix.template({
      // @ts-expect-error create isn't valid
      post: { create: 1 },
    })).toThrow()
    expect(() => permix.template({
      // @ts-expect-error create isn't valid
      post: { create: 'string' },
    })).toThrow()
    expect(() => permix.template({
      // @ts-expect-error create isn't valid
      post: { create: [] },
    })).toThrow()
    expect(() => permix.template({
      // @ts-expect-error create isn't valid
      post: { create: {} },
    })).toThrow()
    expect(() => permix.template({
      // @ts-expect-error create isn't valid
      post: { create: null },
    })).toThrow()
    // @ts-expect-error create isn't valid
    expect(() => permix.template(() => ({
      post: { create: null },
    }))()).toThrow()
  })
})

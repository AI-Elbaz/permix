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
        read: true,
        update: true,
      },
    })

    expect(permix.getJSON()).toEqual({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })
  })

  it('shouldn\'t work if setup is no awaited', async () => {
    permix.setup({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.getJSON()).toEqual({})
  })

  it('should throw an error if setup is not awaited', () => {
    const permix = createPermix()
    expect(permix.check('post', 'read')).toBe(false)
  })

  it('should return true if permission is defined', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should throw an error if permission is not defined', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })

    expect(permix.check('post', 'read')).toBe(true)
    // @ts-expect-error action is not defined
    expect(permix.check('post', 'not-exist')).toBe(false)
  })

  it('should throw an error if entity is not defined', async () => {
    await permix.setup({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })

    // @ts-expect-error entity is not defined
    expect(permix.check('comment', 'create')).toBe(false)
  })

  it('should validate permission as function', async () => {
    await permix.setup({
      post: {
        create: post => post.authorId === '1',
        read: true,
        update: true,
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
        read: true,
        update: true,
      },
    }))

    expect(permix.getJSON()).toEqual({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })
    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should setup async function', async () => {
    await permix.setup(async () => {
      await new Promise(resolve => setTimeout(resolve, 100))

      return {
        post: {
          create: true,
          read: true,
          update: true,
        },
      }
    })

    expect(permix.getJSON()).toEqual({
      post: {
        create: true,
        read: true,
        update: true,
      },
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
            update: true,
          },
        }
      }

      return {
        post: {
          create: false,
          read: false,
          update: false,
        },
      }
    })

    expect(permix.getJSON()).toEqual({
      post: {
        create: true,
        read: true,
        update: true,
      },
    })
    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should call onUpdate callback', async () => {
    const callback = vi.fn()

    permix.on('setup', callback)

    await permix.setup({
      post: {
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

  it('should work with initial permissions and without setup', () => {
    const permix = createPermix<{
      post: {
        action: 'create'
      }
    }>({
      initialPermissions: {
        post: {
          create: true,
        },
      },
    })

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should throw an error if initial permissions are not valid JSON', () => {
    expect(() => createPermix<{
      post: {
        action: 'create'
      }
    }>({
      // @ts-expect-error initialPermissions is not valid JSON
      initialPermissions: 'not-valid-json',
    })).toThrow()
    expect(() => createPermix<{
      post: {
        dataType: { id: string }
        action: 'create'
      }
    }>({
      initialPermissions: {
        post: {
          // @ts-expect-error `create` is not valid JSON
          create: post => post.id === '1',
        },
      },
    })).toThrow()

    expect(() => createPermix<{
      post: {
        action: 'create'
      }
    }>({
      initialPermissions: {
        post: {
          create: true,
        },
      },
    })).not.toThrow()
  })

  it('should return JSON permissions without setup', async () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create'
      }
    }>({
      initialPermissions: {
        post: {
          create: true,
        },
      },
    })

    expect(permix.getJSON()).toEqual({
      post: { create: true },
    })
  })

  it('should define permissions', async () => {
    const permix = createPermix<{
      post: {
        action: 'create'
      }
    }>()

    const permissions = permix.definePermissions({
      post: {
        create: true,
      },
    })

    expect(permissions).toEqual({
      post: {
        create: true,
      },
    })

    await permix.setup(permissions)

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should throw an error if permissions are not valid', () => {
    expect(() => permix.definePermissions({
      // @ts-expect-error create isn't valid
      post: { create: 1 },
    })).toThrow()
    expect(() => permix.definePermissions({
      // @ts-expect-error create isn't valid
      post: { create: 'string' },
    })).toThrow()
    expect(() => permix.definePermissions({
      // @ts-expect-error create isn't valid
      post: { create: [] },
    })).toThrow()
    expect(() => permix.definePermissions({
      // @ts-expect-error create isn't valid
      post: { create: {} },
    })).toThrow()
    expect(() => permix.definePermissions({
      // @ts-expect-error create isn't valid
      post: { create: null },
    })).toThrow()
  })
})

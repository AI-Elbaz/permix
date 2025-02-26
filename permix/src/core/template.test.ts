import type { PermixDefinition } from './createPermix'
import { describe, expect, it } from 'vitest'
import { createPermix } from './createPermix'
import { template } from './template'

type Definition = PermixDefinition<{
  post: {
    action: 'create'
  }
}>

describe('template', () => {
  it('should define permissions with template', () => {
    const permix = createPermix<Definition>()

    const permissions = permix.template({
      post: {
        create: true,
      },
    })

    expect(permissions).toEqual({
      post: {
        create: true,
      },
    })

    permix.setup(permissions)

    expect(permix.check('post', 'create')).toBe(true)
  })

  it('should work with enum based permissions', () => {
    enum PostPermission {
      Create = 'create',
      Read = 'read',
      Update = 'update',
      Delete = 'delete',
    }

    const permix = createPermix<{
      post: {
        action: PostPermission
      }
    }>()

    permix.setup({
      post: {
        [PostPermission.Create]: true,
        [PostPermission.Read]: true,
        [PostPermission.Update]: true,
        delete: true,
      },
    })

    expect(permix.check('post', PostPermission.Create)).toBe(true)
  })

  it('should throw an error if permissions are not valid', () => {
    const permix = createPermix<Definition>()

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
  })

  it('should work with template function', () => {
    const permix = createPermix<Definition>()

    const rules = template<Definition>({
      post: { create: true },
    })

    permix.setup(rules)

    expect(permix.check('post', 'create')).toBe(true)
  })
})

import type { PermixDefinition } from './create-permix'
import { describe, expect, it } from 'vitest'
import { createPermix } from './create-permix'

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

type Definition = PermixDefinition<{
  post: {
    dataType: Post
    action: 'create' | 'read'
  }
  comment: {
    dataType: Comment
    action: 'create' | 'read' | 'update'
  }
}>

describe('createTemplate', () => {
  it('should define permissions with template', () => {
    const permix = createPermix<Definition>()

    const permissions = permix.template({
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

    expect(permissions()).toEqual({
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

    permix.setup(permissions())

    expect(permix.check('post', 'create')).toBe(true)
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

  it('should work with template function with param', () => {
    const permix = createPermix<Definition>()

    const rules1 = permix.template(({ user }: { user: { role: string } }) => ({
      post: {
        create: user.role !== 'admin',
        read: true,
        update: true,
      },
      comment: {
        create: user.role !== 'admin',
        read: true,
        update: true,
      },
    }))

    permix.setup(rules1({ user: { role: 'admin' } }))

    expect(permix.check('post', 'create')).toBe(false)
  })
})

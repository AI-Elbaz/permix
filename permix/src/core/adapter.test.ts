import type { Permix } from './createPermix'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPermixAdapter, createPermixForbiddenContext } from './adapter'

// Define test types
interface Post {
  id: string
  title: string
  authorId: string
}

interface TestContext {
  permixInstance?: Pick<Permix<TestPermixDefinition>, 'check' | 'checkAsync'>
  userData?: {
    id: string
    role: string
  }
}

// Create a proper Record-based type that satisfies PermixDefinition constraints
interface TestPermixDefinition extends Record<string, { dataType?: unknown, action: string }> {
  post: {
    dataType: Post
    action: 'create' | 'read' | 'update' | 'delete'
  }
}

describe('createPermixAdapter', () => {
  let context: TestContext
  let adapterOptions: {
    setPermix: (context: TestContext, permix: Pick<Permix<TestPermixDefinition>, 'check' | 'checkAsync'>) => void
    getPermix: (context: TestContext) => Pick<Permix<TestPermixDefinition>, 'check' | 'checkAsync'>
  }
  // Use any to bypass complex type issues with the adapter
  let adapter: any

  beforeEach(() => {
    context = {
      userData: {
        id: '1',
        role: 'admin',
      },
    }

    adapterOptions = {
      setPermix: (ctx, permix) => {
        ctx.permixInstance = permix
      },
      getPermix: ctx => ctx.permixInstance!,
    }

    adapter = createPermixAdapter<TestPermixDefinition, TestContext>(adapterOptions)
  })

  it('should create an adapter with all expected functions', () => {
    expect(adapter).toHaveProperty('template')
    expect(adapter).toHaveProperty('get')
    expect(adapter).toHaveProperty('setupFunction')
    expect(adapter).toHaveProperty('checkFunction')
  })

  it('should throw an error when trying to get permix without setup', () => {
    context = {}

    expect(() => {
      adapter.get(context)
    }).toThrow('[Permix]: Permix not found')
  })

  it('should setup permix with rules', async () => {
    const setupCallback = vi.fn((ctx: TestContext) => {
      return {
        post: {
          create: ctx.userData?.role === 'admin',
          read: true,
          update: false,
          delete: false,
        },
      }
    })

    await adapter.setupFunction(context, setupCallback)

    expect(setupCallback).toHaveBeenCalledWith(context)
    expect(context.permixInstance).toBeDefined()
  })

  it('should check permissions using the adapter', async () => {
    await adapter.setupFunction(context, () => ({
      post: {
        create: true,
        read: true,
        update: false,
        delete: false,
      },
    }))

    expect(adapter.checkFunction(context, 'post', 'create')).toBe(true)
    expect(adapter.checkFunction(context, 'post', 'update')).toBe(false)
  })

  it('should check permission with data using the adapter', async () => {
    await adapter.setupFunction(context, () => ({
      post: {
        // Use a cast to any to bypass the type checking issue
        create: ((post: any) => post.authorId === context.userData?.id) as any,
        read: true,
        update: false,
        delete: false,
      },
    }))

    const authoredPost = { id: '1', title: 'My Post', authorId: '1' }
    const otherPost = { id: '2', title: 'Other Post', authorId: '2' }

    expect(adapter.checkFunction(context, 'post', 'create', authoredPost)).toBe(true)
    expect(adapter.checkFunction(context, 'post', 'create', otherPost)).toBe(false)
  })

  it('should handle async setup function', async () => {
    const asyncSetupCallback = async (ctx: TestContext) => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 10))

      return {
        post: {
          create: ctx.userData?.role === 'admin',
          read: true,
          update: false,
          delete: false,
        },
      }
    }

    await adapter.setupFunction(context, asyncSetupCallback)

    expect(context.permixInstance).toBeDefined()
    expect(adapter.checkFunction(context, 'post', 'create')).toBe(true)
  })

  it('should expose template function', () => {
    expect(adapter.template).toBeDefined()

    // Just check that template is exposed, we don't check its behavior
    // which should be tested in template.test.ts
    expect(typeof adapter.template).toBe('function')
  })
})

describe('createPermixForbiddenContext', () => {
  it('should create a forbidden context with a single action', () => {
    const context = { userId: '1' }
    const forbiddenContext = createPermixForbiddenContext(context, 'post', 'create')

    expect(forbiddenContext).toEqual({
      userId: '1',
      entity: 'post',
      actions: ['create'],
    })
  })

  it('should create a forbidden context with multiple actions', () => {
    const context = { userId: '1' }
    const forbiddenContext = createPermixForbiddenContext(
      context,
      'post',
      ['create', 'update'] as any,
    )

    expect(forbiddenContext).toEqual({
      userId: '1',
      entity: 'post',
      actions: ['create', 'update'],
    })
  })
})

import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PermixDefinition } from '../core/create-permix'
import { describe, expect, it, vi } from 'vitest'
import { createPermix } from './create-permix'

interface Post {
  id: string
  authorId: string
}

type PermissionsDefinition = PermixDefinition<{
  post: {
    dataType: Post
    action: 'create' | 'read' | 'update'
  }
  user: {
    action: 'delete'
  }
}>

function createMockRequest(): IncomingMessage {
  return {} as IncomingMessage
}

function createMockResponse(): ServerResponse<IncomingMessage> {
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    end: vi.fn(),
    getHeader: vi.fn(),
    writeHead: vi.fn(),
  } as unknown as ServerResponse<IncomingMessage>

  return res
}

describe('createPermix', () => {
  const permix = createPermix<PermissionsDefinition>()

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    permix.checkMiddleware('post', 'delete')
  })

  it('should allow access when permission is granted', async () => {
    const req = createMockRequest()
    const res = createMockResponse()

    const setupMiddleware = permix.setupMiddleware(() => ({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    }))

    await setupMiddleware({ req, res })

    const checkMiddleware = permix.checkMiddleware('post', 'create')

    await checkMiddleware({ req, res })

    expect(res.statusCode).toBe(200)
  })

  it('should deny access when permission is not granted', async () => {
    const req = createMockRequest()
    const res = createMockResponse()

    const setupMiddleware = permix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    }))

    await setupMiddleware({ req, res })

    const checkMiddleware = permix.checkMiddleware('post', 'create')

    await checkMiddleware({ req, res })

    expect(res.statusCode).toBe(403)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Forbidden' }))
  })

  it('should work with custom error handler', async () => {
    const customPermix = createPermix<PermissionsDefinition>({
      onForbidden: ({ res }) => {
        res.statusCode = 403
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Custom error' }))
      },
    })

    const req = createMockRequest()
    const res = createMockResponse()

    const setupMiddleware = customPermix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    }))

    await setupMiddleware({ req, res })

    const checkMiddleware = customPermix.checkMiddleware('post', 'create')

    await checkMiddleware({ req, res })

    expect(res.statusCode).toBe(403)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Custom error' }))
  })

  it('should work with custom error and params', async () => {
    const customPermix = createPermix<PermissionsDefinition>({
      onForbidden: ({ res, entity, actions }) => {
        res.statusCode = 403
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: `You do not have permission to ${actions.join('/')} a ${entity}` }))
      },
    })

    const req = createMockRequest()
    const res = createMockResponse()

    const setupMiddleware = customPermix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    }))

    await setupMiddleware({ req, res })

    const checkMiddleware = customPermix.checkMiddleware('post', 'create')

    await checkMiddleware({ req, res })

    expect(res.statusCode).toBe(403)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'You do not have permission to create a post' }))
  })

  it('should save permix instance in request', async () => {
    const req = createMockRequest()
    const res = createMockResponse()

    const setupMiddleware = permix.setupMiddleware(() => ({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    }))

    await setupMiddleware({ req, res })

    const p = permix.get(req, res)
    expect(p.check('post', 'create')).toBe(true)
    expect(p.check('post', 'read')).toBe(false)
  })

  it('should return an error when permix is not found', () => {
    const req = createMockRequest()
    const res = createMockResponse()

    const p = permix.get(req, res)
    expect(p).toBeNull()
    expect(res.statusCode).toBe(500)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: '[Permix]: Instance not found. Please use the `setupMiddleware` function.' }))
  })
})

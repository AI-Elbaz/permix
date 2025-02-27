import type { IncomingMessage, ServerResponse } from 'node:http'
import type { PermixDefinition } from '../core/createPermix'
import { describe, expect, it, vi } from 'vitest'
import { createPermix } from './createPermix'

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

function createMockResponse(): ServerResponse {
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    end: vi.fn(),
    getHeader: vi.fn(),
    writeHead: vi.fn(),
  } as unknown as ServerResponse

  return res
}

describe('createPermix', () => {
  const permix = createPermix<PermissionsDefinition>()

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    expect(() => permix.checkMiddleware('post', 'delete')()).toThrow()
  })

  it('should allow access when permission is granted', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const next = vi.fn()

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

    await setupMiddleware(req, res, next)
    expect(next).toHaveBeenCalled()

    const checkMiddleware = permix.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)
    expect(nextCheck).toHaveBeenCalled()
  })

  it('should deny access when permission is not granted', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const next = vi.fn()

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

    await setupMiddleware(req, res, next)
    expect(next).toHaveBeenCalled()

    const checkMiddleware = permix.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)

    expect(nextCheck).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Forbidden' }))
  })

  it('should work with custom error handler', async () => {
    const custompermix = createPermix<PermissionsDefinition>({
      onForbidden: ({ res }) => {
        res.statusCode = 403
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: 'Custom error' }))
      },
    })

    const req = createMockRequest()
    const res = createMockResponse()
    const next = vi.fn()

    const setupMiddleware = custompermix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    }))

    await setupMiddleware(req, res, next)

    const checkMiddleware = custompermix.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)

    expect(nextCheck).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Custom error' }))
  })

  it('should work with custom error and params', async () => {
    const custompermix = createPermix<PermissionsDefinition>({
      onForbidden: ({ res, entity, actions }) => {
        res.statusCode = 403
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ error: `You do not have permission to ${actions.join('/')} a ${entity}` }))
      },
    })

    const req = createMockRequest()
    const res = createMockResponse()
    const next = vi.fn()

    const setupMiddleware = custompermix.setupMiddleware(() => ({
      post: {
        create: false,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    }))

    await setupMiddleware(req, res, next)

    const checkMiddleware = custompermix.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)

    expect(nextCheck).not.toHaveBeenCalled()
    expect(res.statusCode).toBe(403)
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'You do not have permission to create a post' }))
  })

  it('should save permix instance in request', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const next = vi.fn()

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

    await setupMiddleware(req, res, next)

    const p = permix.get(req)
    expect(p.check('post', 'create')).toBe(true)
    expect(p.check('post', 'read')).toBe(false)
  })

  it('should return null when permix is not found', () => {
    const req = createMockRequest()

    const p = permix.get(req)
    expect(p).toBeNull()
  })

  it('should work with template', async () => {
    const req = createMockRequest()
    const res = createMockResponse()
    const next = vi.fn()

    const setupMiddleware = permix.setupMiddleware(permix.template({
      post: {
        create: true,
        read: false,
        update: false,
      },
      user: {
        delete: false,
      },
    }))

    await setupMiddleware(req, res, next)
    expect(next).toHaveBeenCalled()

    const checkMiddleware = permix.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)
    expect(nextCheck).toHaveBeenCalled()
  })
})

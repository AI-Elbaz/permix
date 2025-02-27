import type { PermixDefinition } from '../core/createPermix'
import { describe, expect, it, vi } from 'vitest'
import { createPermixServer } from './createPermixServer'

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

// Define custom mock types to simulate framework responses
interface MockExpressResponse {
  status: (code: number) => { json: (data: any) => void }
  json: (data: any) => void
}

interface MockNodeResponse {
  statusCode: number
  setHeader: (name: string, value: string) => void
  end: (data: string) => void
}

// Mock request and response objects
function createMockRequest(): Request {
  return {} as Request
}

function createMockExpressResponse(): Response {
  const res = {
    status: vi.fn(function (this: any) { return this }),
    json: vi.fn(),
  } as unknown as Response

  return res
}

function createMockNodeResponse(): Response {
  const res = {
    statusCode: 200,
    setHeader: vi.fn(),
    end: vi.fn(),
  } as unknown as Response

  return res
}

describe('createPermixServer', () => {
  const permixServer = createPermixServer<PermissionsDefinition>()

  it('should throw ts error', () => {
    // @ts-expect-error should throw
    expect(() => permixServer.checkMiddleware('post', 'delete')()).toThrow()
  })

  it('should allow access when permission is granted', async () => {
    const req = createMockRequest()
    const res = createMockExpressResponse()
    const next = vi.fn()

    const setupMiddleware = permixServer.setupMiddleware(() => ({
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

    const checkMiddleware = permixServer.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)
    expect(nextCheck).toHaveBeenCalled()
  })

  it('should deny access when permission is not granted (Express-like response)', async () => {
    const req = createMockRequest()
    const res = createMockExpressResponse()
    const next = vi.fn()
    const expressRes = res as unknown as MockExpressResponse

    const setupMiddleware = permixServer.setupMiddleware(() => ({
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

    const checkMiddleware = permixServer.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)

    expect(nextCheck).not.toHaveBeenCalled()
    expect(expressRes.status).toHaveBeenCalledWith(403)
    expect(expressRes.json).toHaveBeenCalledWith({ error: 'Forbidden' })
  })

  it('should deny access when permission is not granted (Node-like response)', async () => {
    const req = createMockRequest()
    const res = createMockNodeResponse()
    const next = vi.fn()
    const nodeRes = res as unknown as MockNodeResponse

    const setupMiddleware = permixServer.setupMiddleware(() => ({
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

    const checkMiddleware = permixServer.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)

    expect(nextCheck).not.toHaveBeenCalled()
    expect(nodeRes.statusCode).toBe(403)
    expect(nodeRes.setHeader).toHaveBeenCalledWith('Content-Type', 'application/json')
    expect(nodeRes.end).toHaveBeenCalledWith(JSON.stringify({ error: 'Forbidden' }))
  })

  it('should work with custom error handler', async () => {
    const customPermixServer = createPermixServer<PermissionsDefinition>({
      onUnauthorized: ({ res, next: _next }) => {
        if ('status' in res && 'json' in res) {
          const expressRes = res as unknown as MockExpressResponse
          expressRes.status(401).json({ error: 'Custom error' })
        }
      },
    })

    const req = createMockRequest()
    const res = createMockExpressResponse()
    const next = vi.fn()
    const expressRes = res as unknown as MockExpressResponse

    const setupMiddleware = customPermixServer.setupMiddleware(() => ({
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

    const checkMiddleware = customPermixServer.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)

    expect(nextCheck).not.toHaveBeenCalled()
    expect(expressRes.status).toHaveBeenCalledWith(401)
    expect(expressRes.json).toHaveBeenCalledWith({ error: 'Custom error' })
  })

  it('should work with custom error and params', async () => {
    const customPermixServer = createPermixServer<PermissionsDefinition>({
      onUnauthorized: ({ res, entity, actions }) => {
        if ('status' in res && 'json' in res) {
          const expressRes = res as unknown as MockExpressResponse
          expressRes.status(401).json({ error: `You do not have permission to ${actions.join('/')} a ${entity}` })
        }
      },
    })

    const req = createMockRequest()
    const res = createMockExpressResponse()
    const next = vi.fn()
    const expressRes = res as unknown as MockExpressResponse

    const setupMiddleware = customPermixServer.setupMiddleware(() => ({
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

    const checkMiddleware = customPermixServer.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)

    expect(nextCheck).not.toHaveBeenCalled()
    expect(expressRes.status).toHaveBeenCalledWith(401)
    expect(expressRes.json).toHaveBeenCalledWith({ error: 'You do not have permission to create a post' })
  })

  it('should save permix instance in request', async () => {
    const req = createMockRequest()
    const res = createMockExpressResponse()
    const next = vi.fn()

    const setupMiddleware = permixServer.setupMiddleware(() => ({
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

    const permix = permixServer.get(req)
    expect(permix.check('post', 'create')).toBe(true)
    expect(permix.check('post', 'read')).toBe(false)
  })

  it('should return null when permix is not found', () => {
    const req = createMockRequest()

    const permix = permixServer.get(req)
    expect(permix).toBeNull()
  })

  it('should work with template', async () => {
    const req = createMockRequest()
    const res = createMockExpressResponse()
    const next = vi.fn()

    const setupMiddleware = permixServer.setupMiddleware(permixServer.template({
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

    const checkMiddleware = permixServer.checkMiddleware('post', 'create')
    const nextCheck = vi.fn()

    checkMiddleware(req, res, nextCheck)
    expect(nextCheck).toHaveBeenCalled()
  })
})

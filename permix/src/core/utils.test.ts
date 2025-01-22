import { describe, expect, it } from 'vitest'
import { isPermissionsValid } from './utils'

describe('utils', () => {
  it('should return true for valid permissions object', () => {
    const permissions = {
      post: {
        create: true,
        read: false,
      },
    }

    expect(isPermissionsValid(permissions)).toBe(true)
  })

  it('should return true for permissions with function values', () => {
    const permissions = {
      post: {
        create: () => true,
        read: (data: any) => data.id === '1',
      },
    }

    expect(isPermissionsValid(permissions)).toBe(true)
  })

  it('should return false for invalid permissions object', () => {
    const permissions = {
      post: {
        create: true,
        read: 'string',
      },
    }

    expect(isPermissionsValid(permissions)).toBe(false)
  })

  it('should return false for null value', () => {
    expect(isPermissionsValid(null)).toBe(false)
  })

  it('should return false for non-object value', () => {
    expect(isPermissionsValid('string')).toBe(false)
    expect(isPermissionsValid(123)).toBe(false)
    expect(isPermissionsValid(true)).toBe(false)
  })
})

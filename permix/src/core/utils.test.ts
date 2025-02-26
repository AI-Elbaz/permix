import { describe, expect, it } from 'vitest'
import { isRulesValid } from './utils'

describe('utils', () => {
  it('should return true for valid permissions object', () => {
    const permissions = {
      post: {
        create: true,
        read: false,
      },
    }

    expect(isRulesValid(permissions)).toBe(true)
  })

  it('should return true for permissions with function values', () => {
    const permissions = {
      post: {
        create: () => true,
        read: (data: any) => data.id === '1',
      },
    }

    expect(isRulesValid(permissions)).toBe(true)
  })

  it('should return false for invalid permissions object', () => {
    const permissions = {
      post: {
        create: true,
        read: 'string',
      },
    }

    expect(isRulesValid(permissions)).toBe(false)
  })

  it('should return false for null value', () => {
    expect(isRulesValid(null)).toBe(false)
  })

  it('should return false for non-object value', () => {
    expect(isRulesValid('string')).toBe(false)
    expect(isRulesValid(123)).toBe(false)
    expect(isRulesValid(true)).toBe(false)
  })
})

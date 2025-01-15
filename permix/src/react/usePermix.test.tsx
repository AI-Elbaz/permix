import { render, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { createPermix } from '../core/createPermix'
import { usePermix } from './usePermix'
import '@testing-library/jest-dom/vitest'

describe('usePermix', () => {
  it('should work with custom hook', async () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create' | 'read'
      }
    }>()

    await permix.setup({
      post: {
        create: true,
      },
    })

    const usePermissions = () => usePermix(permix)

    const { result } = renderHook(() => usePermissions())

    expect(result.current.check('post', 'create')).toBe(true)
    expect(result.current.check('post', 'read')).toBe(false)
  })

  it('should work with DOM render', async () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create' | 'read'
      }
    }>()

    await permix.setup({
      post: {
        create: true,
      },
    })

    const TestComponent = () => {
      const { check } = usePermix(permix)

      return (
        <div>
          <span data-testid="create">{check('post', 'create').toString()}</span>
          <span data-testid="read">{check('post', 'read').toString()}</span>
        </div>
      )
    }

    const { getByTestId } = render(<TestComponent />)

    expect(getByTestId('create')).toHaveTextContent('true')
    expect(getByTestId('read')).toHaveTextContent('false')

    await permix.setup({
      post: {
        create: false,
        read: true,
      },
    })

    await waitFor(() => {
      expect(getByTestId('create')).toHaveTextContent('false')
      expect(getByTestId('read')).toHaveTextContent('true')
    })
  })
})

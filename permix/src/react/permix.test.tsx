import { render, renderHook, waitFor } from '@testing-library/react'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { createPermix } from '../core/createPermix'
import { dehydrate } from '../core/hydration'
import { PermixHydrate, PermixProvider, usePermix } from './index'
import '@testing-library/jest-dom/vitest'

describe('permix react', () => {
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
        read: false,
      },
    })

    const usePermissions = () => usePermix(permix)

    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <PermixProvider permix={permix}>{children}</PermixProvider>
      ),
    })

    expect(result.current.check('post', 'create')).toBe(true)
    expect(result.current.check('post', 'read')).toBe(false)
  })

  it('should work with DOM rerender', async () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create' | 'read'
      }
    }>()

    await permix.setup({
      post: {
        create: post => post.id === '1',
        read: false,
      },
    })

    const TestComponent = () => {
      const { check } = usePermix(permix)

      const post = { id: '1' }

      return (
        <div>
          <span data-testid="create">{check('post', 'create', post).toString()}</span>
          <span data-testid="read">{check('post', 'read').toString()}</span>
        </div>
      )
    }

    const { getByTestId } = render(
      <PermixProvider permix={permix}>
        <TestComponent />
      </PermixProvider>,
    )

    expect(getByTestId('create')).toHaveTextContent('true')
    expect(getByTestId('read')).toHaveTextContent('false')

    await permix.setup({
      post: {
        create: post => post.id === '2',
        read: true,
      },
    })

    await waitFor(() => {
      expect(getByTestId('create')).toHaveTextContent('false')
      expect(getByTestId('read')).toHaveTextContent('true')
    })
  })

  it('should check isReady', async () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create' | 'read'
      }
    }>()

    const TestComponent = () => {
      const { isReady } = usePermix(permix)
      return <div>{isReady.toString()}</div>
    }

    const { container } = render(
      <PermixProvider permix={permix}>
        <TestComponent />
      </PermixProvider>,
    )

    expect(container.firstChild).toHaveTextContent('false')

    await permix.setup({
      post: {
        create: true,
        read: false,
      },
    })

    await waitFor(() => {
      expect(container.firstChild).toHaveTextContent('true')
    })
  })

  it('should hydrate state correctly', async () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create' | 'read'
      }
    }>()

    await permix.setup({
      post: {
        create: true,
        read: false,
      },
    })

    const TestComponent = () => {
      const { isReady } = usePermix(permix)
      return <div data-testid="ready-state">{isReady.toString()}</div>
    }

    const { getByTestId } = render(
      <PermixProvider permix={permix}>
        <PermixHydrate state={dehydrate(permix)}>
          <TestComponent />
        </PermixHydrate>
      </PermixProvider>,
    )

    expect(getByTestId('ready-state')).toHaveTextContent('true')
  })
})

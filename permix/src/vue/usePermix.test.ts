import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'
import { createPermix } from '../core/createPermix'
import { usePermix } from './usePermix'

describe('usePermix', () => {
  it('should check permissions correctly', async () => {
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

    const { check } = usePermix(permix)

    expect(check('post', 'create')).toBe(true)
    expect(check('post', 'read')).toBe(false)
  })

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

    const { check } = usePermissions()

    expect(check('post', 'create')).toBe(true)
    expect(check('post', 'read')).toBe(false)
  })

  it('should work in component', async () => {
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

    const TestComponent = defineComponent({
      setup() {
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const { check } = usePermix(permix)
        return { check }
      },
      template: `
        <div>
          <span data-testid="create">{{ check('post', 'create') }}</span>
          <span data-testid="read">{{ check('post', 'read') }}</span>
        </div>
      `,
    })

    const wrapper = mount(TestComponent)

    expect(wrapper.get('[data-testid="create"]').text()).toBe('true')
    expect(wrapper.get('[data-testid="read"]').text()).toBe('false')

    await permix.setup({
      post: {
        create: false,
        read: true
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid="create"]').text()).toBe('false')
    expect(wrapper.get('[data-testid="read"]').text()).toBe('true')
  })
})

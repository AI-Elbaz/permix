/* eslint-disable react-hooks/rules-of-hooks */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent } from 'vue'
import { createPermix } from '../core/createPermix'
import { permixPlugin, usePermix } from './usePermix'

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
        read: false,
      },
    })

    const TestWrapper = defineComponent({
      template: '<div></div>',
      setup() {
        const { check } = usePermix(permix)
        return { check }
      },
    })

    const wrapper = mount(TestWrapper, {
      global: {
        plugins: [[permixPlugin, { permix }]],
      },
    })

    const { check } = wrapper.vm

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
        read: false,
      },
    })

    const TestComponent = defineComponent({
      setup() {
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

    const app = createApp({})
    app.use(permixPlugin, { permix })

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[permixPlugin, { permix }]],
      },
    })

    expect(wrapper.get('[data-testid="create"]').text()).toBe('true')
    expect(wrapper.get('[data-testid="read"]').text()).toBe('false')

    await permix.setup({
      post: {
        create: false,
        read: true,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid="create"]').text()).toBe('false')
    expect(wrapper.get('[data-testid="read"]').text()).toBe('true')
  })
})

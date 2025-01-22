/* eslint-disable react-hooks/rules-of-hooks */
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createApp, defineComponent, ref } from 'vue'
import { createPermix } from '../core/createPermix'
import { permixPlugin, usePermix } from './index'

describe('composables', () => {
  it('should work with custom hook', () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create' | 'read'
      }
    }>()

    permix.setup({
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

  it('should work with DOM rerender', async () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create' | 'read'
      }
    }>()

    permix.setup({
      post: {
        create: post => post.id === '1',
        read: false,
      },
    })

    const TestComponent = defineComponent({
      setup() {
        const { check } = usePermix(permix)

        const post = ref({ id: '1' })

        return { check, post }
      },
      template: `
        <div>
          <span data-testid="create">{{ check('post', 'create', post) }}</span>
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

    permix.setup({
      post: {
        create: post => post.id === '2',
        read: true,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.get('[data-testid="create"]').text()).toBe('false')
    expect(wrapper.get('[data-testid="read"]').text()).toBe('true')
  })

  it('should check isReady', async () => {
    const permix = createPermix<{
      post: {
        dataType: { id: string }
        action: 'create' | 'read'
      }
    }>()

    const TestWrapper = defineComponent({
      setup() {
        const { isReady } = usePermix(permix)
        return { isReady }
      },
      template: '<div>{{ isReady }}</div>',
    })

    const wrapper = mount(TestWrapper, {
      global: {
        plugins: [[permixPlugin, { permix }]],
      },
    })

    expect(wrapper.get('div').text()).toBe('false')

    permix.setup({
      post: {
        create: true,
        read: false,
      },
    })

    await wrapper.vm.$nextTick()

    expect(wrapper.get('div').text()).toBe('true')
  })
})

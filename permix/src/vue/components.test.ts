import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { createPermix } from '../core'
import { createComponents } from './components'
import { permixPlugin } from './plugin'

describe('components', () => {
  it('should work with Check component', () => {
    const permix = createPermix<{
      post: {
        action: 'create'
      }
    }>()

    permix.setup({
      post: {
        create: true,
      },
    })

    const text = 'Post can be created'

    const { Check } = createComponents(permix)

    const TestPost = {
      template: `
        <Check entity="post" action="create">
          <div>{{ text }}</div>
        </Check>
      `,
      components: { Check },
      setup() {
        return { text }
      },
    }

    const wrapper = mount(TestPost, {
      global: {
        plugins: [[permixPlugin, { permix }]],
      },
    })

    expect(wrapper.text()).toContain(text)
  })

  it('should work with Check component and entity', () => {
    const permix = createPermix<{
      post: {
        dataType: { authorId: string }
        action: 'edit'
      }
    }>()

    permix.setup({
      post: {
        edit: post => post.authorId === '1',
      },
    })

    const canText = 'Post can be created'
    const cannotText = 'Post cannot be created'

    const { Check } = createComponents(permix)

    const TestPost1 = {
      template: `
        <Check entity="post" action="edit" :data="{ authorId: '1' }">
          <div data-testid="post-can-be-created">{{ text }}</div>
        </Check>
      `,
      components: { Check },
      setup() {
        return { text: canText }
      },
    }

    const wrapper1 = mount(TestPost1, {
      global: {
        plugins: [[permixPlugin, { permix }]],
      },
    })

    expect(wrapper1.html()).toContain(canText)

    const TestPost2 = {
      template: `
        <Check entity="post" action="edit" :data="{ authorId: '2' }">
          <div data-testid="post-can-be-created">{{ canText }}</div>
          <template #else>
            <div data-testid="else">{{ cannotText }}</div>
          </template>
        </Check>
      `,
      components: { Check },
      setup() {
        return { canText, cannotText }
      },
    }

    const wrapper2 = mount(TestPost2, {
      global: {
        plugins: [[permixPlugin, { permix }]],
      },
    })

    expect(wrapper2.html()).not.toContain(canText)
    expect(wrapper2.html()).toContain(cannotText)
  })

  it('should work with Check component and DOM rerender', async () => {
    const permix = createPermix<{
      post: {
        action: 'read'
      }
    }>()

    permix.setup({
      post: {
        read: false,
      },
    })

    const text = 'Post can be read'

    const { Check } = createComponents(permix)

    const TestComponent = {
      template: `
        <Check entity="post" action="read">
          <span data-testid="read">{{ text }}</span>
        </Check>
      `,
      components: { Check },
      setup() {
        return { text }
      },
    }

    const wrapper = mount(TestComponent, {
      global: {
        plugins: [[permixPlugin, { permix }]],
      },
    })

    expect(wrapper.html()).not.toContain(text)

    permix.setup({
      post: {
        read: true,
      },
    })

    await wrapper.vm.$nextTick()
    expect(wrapper.html()).toContain(text)
  })
})

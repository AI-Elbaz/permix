import type { SlotsType } from 'vue'
import type { CheckFunctionObject, Permix, PermixDefinition } from '../core/createPermix'
import { defineComponent } from 'vue'
import { usePermix } from './composables'

export function createComponents<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  const Check = defineComponent<CheckFunctionObject<Permissions, keyof Permissions>>({
    name: 'Check',
    props: {
      entity: {
        type: String,
        required: true,
      },
      action: {
        type: String,
        required: true,
      },
      data: Object,
    },
    slots: Object as SlotsType<{
      default: void
      fallback?: void
    }>,
    inheritAttrs: false,
    setup(props, { slots }) {
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const { check } = usePermix(permix)

      return () => [check(props.entity, props.action, props.data) ? slots.default?.() : slots.fallback?.()]
    },
  })

  return {
    Check,
  }
}

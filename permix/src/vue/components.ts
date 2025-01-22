import type { SlotsType } from 'vue'
import type { CheckFunctionObject, Permix, PermixDefinition } from '../core/createPermix'
import { defineComponent, useSlots } from 'vue'
import { usePermix } from './composables'

// Props extends Record<string, any>, E extends EmitsOptions = {}, EE extends string = string, S extends SlotsType

export function createComponents<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  const Check = defineComponent<
    CheckFunctionObject<Permissions, keyof Permissions>,
    any,
    any,
    SlotsType<{
      default: void
      else?: void
    }>
  >((props) => {
    const slots = useSlots()
    const { check } = usePermix(permix)

    return () => [check(props.entity, props.action, props.data) ? slots.default?.() : slots.else?.()]
  }, {
    inheritAttrs: false,
    props: {
      entity: {
        type: String,
        required: true,
      },
      action: {
        type: String,
        required: true,
      },
      data: {
        type: Object,
        required: false,
      },
    },
    slots: Object as SlotsType<{
      default: void
      else?: void
    }>,
  })

  return {
    Check,
  }
}

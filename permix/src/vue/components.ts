import type { SetupContext, SlotsType } from 'vue'
import type { CheckFunctionObject, Permix, PermixDefinition } from '../core/createPermix'
import { usePermix } from './composables'

export function createComponents<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  function Check<K extends keyof Permissions>(
    props: CheckFunctionObject<Permissions, K> & { reverse?: boolean },
    context: SetupContext<any, SlotsType<{
      default: void
      otherwise?: void
    }>>,
  ) {
    const { check } = usePermix(permix)

    const hasPermission = check(props.entity, props.action, props.data)
    return props.reverse
      ? (hasPermission ? context.slots.otherwise?.() : context.slots.default?.())
      : (hasPermission ? context.slots.default?.() : context.slots.otherwise?.())
  }

  Check.inheritAttrs = false
  Check.props = {
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
    reverse: {
      type: Boolean,
      required: false,
      default: false,
    },
  }

  return {
    Check,
  }
}

import type { SetupContext, SlotsType } from 'vue'
import type { CheckFunctionObject, Permix, PermixDefinition } from '../core/createPermix'
import { usePermix } from './composables'

export function createComponents<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  function Check<K extends keyof Permissions>(
    props: CheckFunctionObject<Permissions, K>,
    context: SetupContext<any, SlotsType<{
      default: void
      else?: void
    }>>,
  ) {
    const { check } = usePermix(permix)

    return check(props.entity, props.action, props.data) ? context.slots.default?.() : context.slots.else?.()
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
  }

  return {
    Check,
  }
}

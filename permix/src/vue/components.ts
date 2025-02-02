import type { SetupContext, SlotsType, VNode } from 'vue'
import type { CheckFunctionObject, Permix, PermixDefinition } from '../core/createPermix'
import { usePermix } from './composables'

interface CheckProps<Permissions extends PermixDefinition, K extends keyof Permissions> extends CheckFunctionObject<Permissions, K> {
  reverse?: boolean
}

type CheckContext = SetupContext<any, SlotsType<{
  default: void
  otherwise?: void
}>>

export interface PermixComponents<Permissions extends PermixDefinition> {
  Check: <K extends keyof Permissions>(
    props: CheckProps<Permissions, K>,
    context: CheckContext,
  ) => VNode | VNode[] | undefined
}

export function createComponents<Permissions extends PermixDefinition>(permix: Permix<Permissions>): PermixComponents<Permissions> {
  function Check<K extends keyof Permissions>(
    props: CheckProps<Permissions, K>,
    context: CheckContext,
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

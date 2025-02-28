import type { SetupContext, SlotsType, VNode } from 'vue'
import type { Permix, PermixDefinition } from '../core/create-permix'
import type { CheckFunctionObject } from '../core/params'
import { usePermix } from './composables'

export interface CheckProps<Definition extends PermixDefinition, K extends keyof Definition> extends CheckFunctionObject<Definition, K> {
  reverse?: boolean
}

type CheckContext = SetupContext<any, SlotsType<{
  default: void
  otherwise?: void
}>>

export interface PermixComponents<Definition extends PermixDefinition> {
  Check: <K extends keyof Definition>(
    props: CheckProps<Definition, K>,
    context: CheckContext,
  ) => VNode | VNode[] | undefined
}

export function createComponents<Definition extends PermixDefinition>(permix: Permix<Definition>): PermixComponents<Definition> {
  function Check<K extends keyof Definition>(
    props: CheckProps<Definition, K>,
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
      type: [String, Array],
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

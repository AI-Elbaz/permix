import type { Permix, PermixDefinition } from '../core'
import type { PermixStateJSON } from '../core/create-permix'
import type { CheckFunctionObject } from '../core/params'
import * as React from 'react'
import { hydrate } from '../core'
import { validatePermix } from '../core/create-permix'
import { Context, usePermix, usePermixContext } from './hooks'
/**
 * Provider that provides the Permix context to your React components.
 *
 * @link https://permix.letstri.dev/docs/integrations/react
 */
export function PermixProvider<Permissions extends PermixDefinition>({
  children,
  permix,
}: { children: React.ReactNode, permix: Permix<Permissions> }) {
  validatePermix(permix)

  const [context, setContext] = React.useState({
    permix,
    isReady: false,
    state: permix._.getState(),
  })

  function updateState() {
    validatePermix(permix)
    setContext(c => ({ ...c, state: permix._.getState() }))
  }

  function updateReady() {
    setContext(c => ({ ...c, isReady: permix.isReady() }))
  }

  React.useEffect(() => {
    updateState()
    return permix.hook('setup', () => updateState())
  }, [permix])

  React.useEffect(() => {
    updateReady()
    return permix.hook('ready', () => updateReady())
  }, [permix])

  return (
    // eslint-disable-next-line react/no-context-provider
    <Context.Provider value={context}>
      {children}
    </Context.Provider>
  )
}

export function PermixHydrate({ children, state }: { children: React.ReactNode, state: PermixStateJSON<any> }) {
  const { permix } = usePermixContext()

  validatePermix(permix)

  React.useMemo(() => hydrate(permix, state), [permix, state])

  return children
}

export interface CheckProps<Permissions extends PermixDefinition, K extends keyof Permissions> extends CheckFunctionObject<Permissions, K> {
  children: React.ReactNode
  otherwise?: React.ReactNode
  reverse?: boolean
}

export interface PermixComponents<Permissions extends PermixDefinition> {
  Check: <K extends keyof Permissions>(props: CheckProps<Permissions, K>) => React.ReactNode
}

// eslint-disable-next-line react-refresh/only-export-components
export function createComponents<Permissions extends PermixDefinition>(permix: Permix<Permissions>): PermixComponents<Permissions> {
  function Check<K extends keyof Permissions>({
    children,
    entity,
    action,
    data,
    otherwise = null,
    reverse = false,
  }: CheckProps<Permissions, K>) {
    const { check } = usePermix(permix)

    const hasPermission = check(entity, action, data)
    return (
      <>
        {reverse
          ? hasPermission ? otherwise : children
          : hasPermission ? children : otherwise}
      </>
    )
  }

  Check.displayName = 'Check'

  return {
    Check,
  }
}

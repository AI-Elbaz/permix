import type { CheckFunctionObject, PermixStateJSON } from '../core/createPermix'
import * as React from 'react'
import { hydrate, type Permix, type PermixDefinition } from '../core'
import { validatePermix } from '../core/createPermix'
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

  React.useEffect(() => {
    return permix.hook('setup', () => {
      setContext(c => ({ ...c, state: permix._.getState() }))
    })
  }, [permix])

  React.useEffect(() => {
    return permix.hook('ready', () => {
      setContext(c => ({ ...c, isReady: true }))
    })
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

// eslint-disable-next-line react-refresh/only-export-components
export function createComponents<Permissions extends PermixDefinition>(permix: Permix<Permissions>) {
  function Check<K extends keyof Permissions>({
    children,
    entity,
    action,
    data,
    otherwise = null,
    reverse = false,
  }: {
    children: React.ReactNode
    otherwise?: React.ReactNode
    reverse?: boolean
  } & CheckFunctionObject<Permissions, K>) {
    const { check } = usePermix(permix)

    const hasPermission = check(entity, action, data)
    return <>{reverse ? hasPermission ? otherwise : children : hasPermission ? children : otherwise}</>
  }

  Check.displayName = 'Check'

  return {
    Check,
  }
}

type HookHandler<T = any> = (...args: T[]) => void

export function createHooks<T extends Record<string, HookHandler>>() {
  let hooks: Record<string, HookHandler[]> = {}

  const hook = <K extends keyof T>(name: K, fn: T[K]) => {
    if (!hooks[name as string]) {
      hooks[name as string] = []
    }
    hooks[name as string].push(fn)

    return () => {
      const index = hooks[name as string].indexOf(fn)
      if (index !== -1) {
        hooks[name as string].splice(index, 1)
      }
    }
  }

  const hookOnce = <K extends keyof T>(name: K, fn: T[K]) => {
    const remove = hook(name, ((...args) => {
      remove()
      fn(...args)
    }) as T[K])
  }

  const removeHook = <K extends keyof T>(name: K, fn: T[K]) => {
    if (hooks[name as string]) {
      const index = hooks[name as string].indexOf(fn)
      if (index !== -1) {
        hooks[name as string].splice(index, 1)
      }
    }
  }

  const callHook = <K extends keyof T>(name: K, ...args: Parameters<T[K]>) => {
    if (hooks[name as string]) {
      for (const fn of hooks[name as string]) {
        fn(...args)
      }
    }
  }

  const clearHook = <K extends keyof T>(name: K) => {
    delete hooks[name as string]
  }

  const clearAllHooks = () => {
    hooks = {}
  }

  return {
    hook,
    hookOnce,
    removeHook,
    callHook,
    clearHook,
    clearAllHooks,
  }
}

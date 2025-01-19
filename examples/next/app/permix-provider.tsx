'use client'

import { permix, setupPermix } from '@/lib/permix'
import { PermixProvider as Provider } from 'permix/react'
import { useEffect } from 'react'

export function PermixProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const timeout = setTimeout(() => {
      setupPermix()
    }, 1000)

    return () => clearTimeout(timeout)
  }, [])

  return (
    <Provider permix={permix}>
      {children}
    </Provider>
  )
}

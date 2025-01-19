'use client'

import { permix, setupPermix } from '@/lib/permix'
import { PermixProvider as Provider } from 'permix/react'
import { useEffect } from 'react'

export function PermixProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    setupPermix()
  }, [])

  return (
    <Provider permix={permix}>
      {children}
    </Provider>
  )
}

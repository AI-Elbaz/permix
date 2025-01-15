'use client'

import { setupPermix } from '@/lib/permix'
import { useEffect } from 'react'

function useUser() {
  return {
    role: 'admin' as const,
  }
}

export function PermixProvider({ children }: { children: React.ReactNode }) {
  const user = useUser()

  useEffect(() => {
    setupPermix(user.role)
  }, [user.role])

  return <>{children}</>
}

'use client'

import { usePermissions } from '@/hooks/permissions'

export default function ClientPage() {
  const { check } = usePermissions()

  return (
    <div>
      Can I create a post?
      {check('post', 'create') ? 'Yes' : 'No'}
    </div>
  )
}

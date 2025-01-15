'use client'

import { usePermissions } from '@/hooks/permissions'

export default function ClientPage() {
  const { check } = usePermissions()

  return (
    <div>
      Can I delete a user?
      {check('user', 'delete') ? 'Yes' : 'No'}
    </div>
  )
}

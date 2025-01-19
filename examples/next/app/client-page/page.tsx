'use client'

import { usePermissions } from '@/hooks/use-permissions'

export default function ClientPage() {
  const { check, isReady } = usePermissions()

  return (
    <div>
      {isReady ? 'ready' : 'not ready'}
      <hr />
      Can I read a post?
      {' '}
      {check('post', 'read') ? 'yes' : 'no'}
    </div>
  )
}

'use client'

import { usePermissions } from '@/hooks/use-permissions'

export default function Home() {
  const { check, isReady } = usePermissions()

  return (
    <div>
      Is Permix Ready?
      {' '}
      {isReady ? 'Yes' : 'No'}
      <hr />
      Can I create a post?
      {' '}
      {check('post', 'create') ? 'Yes' : 'No'}
    </div>
  )
}

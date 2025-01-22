'use client'

import { usePermissions } from '@/hooks/use-permissions'
import { Check } from '@/lib/permix-components'

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
      <hr />
      <Check entity="post" action="create" otherwise={<div>You don't have permission to create a post</div>}>
        Can I create a post inside the Check component?
      </Check>
    </div>
  )
}

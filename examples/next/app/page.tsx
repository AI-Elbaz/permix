import { setupPermixServer } from '@/lib/permix-server'

export default async function Home() {
  const permix = await setupPermixServer()

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      Can I create a post?
      {' '}
      {permix.check('user', 'delete') ? 'Yes' : 'No'}
    </div>
  )
}

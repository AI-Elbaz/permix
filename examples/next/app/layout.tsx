import { permix, setupPermix } from '@/lib/permix'
import { dehydrate } from 'permix'
import { PermixHydrate } from 'permix/react'
import { PermixProvider } from './permix-provider'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await setupPermix()

  return (
    <html lang="en">
      <body>
        <PermixProvider>
          <PermixHydrate state={dehydrate(permix)}>
            {children}
          </PermixHydrate>
        </PermixProvider>
      </body>
    </html>
  )
}

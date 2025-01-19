import { PermixProvider } from './permix-provider'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <PermixProvider>
          {children}
        </PermixProvider>
      </body>
    </html>
  )
}

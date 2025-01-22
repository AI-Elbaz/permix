import { permix } from '@/shared/permix'
import { PermixProvider } from 'permix/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PermixProvider permix={permix}>
      <App />
    </PermixProvider>
  </StrictMode>,
)

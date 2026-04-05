import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from '@/App'
import { AppProviders } from '@/providers/AppProviders'
import '@/styles/global.css'

const root = document.getElementById('root')
if (!root) {
  throw new Error('Root-Element #root fehlt.')
}

createRoot(root).render(
  <StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </StrictMode>,
)

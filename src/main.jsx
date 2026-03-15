import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { VastuProvider } from './store/VastuContext.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <VastuProvider>
      <App />
    </VastuProvider>
  </StrictMode>,
)

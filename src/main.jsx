import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { GlobalAnimationProvider } from './features/animations/Animations.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalAnimationProvider>
      <App />
    </GlobalAnimationProvider>
  </StrictMode>,
)

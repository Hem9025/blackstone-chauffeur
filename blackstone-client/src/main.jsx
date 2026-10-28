import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import { registerServiceWorker } from './utils/push.js'

registerServiceWorker()

// The build step (scripts/seoPrerender.js) bakes this page's canonical, meta
// description and social tags into the raw HTML for crawlers that don't run
// JavaScript. Once the app is running, <PageMeta> (react-helmet-async) sets
// its own copy of the same tags — so drop the baked-in ones first, otherwise
// the page ends up with two canonicals and two descriptions.
document.querySelectorAll('[data-static-seo]').forEach((el) => el.remove())

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

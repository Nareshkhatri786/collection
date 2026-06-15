import React from 'react'
import ReactDOM from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          background: '#141c2e',
          color: '#f0f4ff',
          border: '1px solid rgba(79,142,247,0.2)',
          borderRadius: '10px',
          fontSize: '13px'
        },
        success: { iconTheme: { primary: '#34d399', secondary: '#141c2e' } },
        error: { iconTheme: { primary: '#f87171', secondary: '#141c2e' } }
      }}
    />
  </React.StrictMode>
)

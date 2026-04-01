import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

const root = document.getElementById('root')
if (!root) {
  console.error('Root element not found!')
} else {
  try {
    ReactDOM.createRoot(root).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
    console.log('App rendered successfully')
  } catch (error) {
    console.error('Error rendering app:', error)
    root.innerHTML = `<div style="padding: 20px; color: red;">
      <h1>Error Loading App</h1>
      <p>${error.message}</p>
      <pre>${error.stack}</pre>
    </div>`
  }
}

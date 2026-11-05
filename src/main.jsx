import React from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

const root = document.getElementById('root')
const app = (
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)


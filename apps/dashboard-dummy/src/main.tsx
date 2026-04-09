import React from 'react'
import ReactDOM from 'react-dom/client'
import DashboardView from './DashboardView'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div style={{ height: '100dvh', background: 'linear-gradient(135deg, #0f172a, #581c87, #312e81)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <DashboardView />
    </div>
  </React.StrictMode>
)

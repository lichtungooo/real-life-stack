import { useState } from 'react'
import { Navbar } from './components/Navbar'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './components/Dashboard'
import { HUD } from './components/HUD'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-dvh flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
      <Navbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex min-h-0">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <Dashboard />
      </div>
      <HUD />
    </div>
  )
}

export default App

/// <reference types="vite/client" />
import React from 'react'
import ReactDOM from 'react-dom/client'
import DashboardView from './components/dashboard/DashboardView'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <div className="h-dvh bg-gradient-to-br from-slate-900 via-purple-900 to-indigo-900 overflow-hidden flex flex-col">
      {/* Simple top bar */}
      <div className="flex-shrink-0 h-16 flex items-center px-6 bg-white/10 backdrop-blur-lg border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-orange-500/30 rounded-lg flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fb923c" strokeWidth="2"><path d="M12 2v8m0 0l4-4m-4 4L8 6"/><path d="M2 12h8m0 0l-4 4m4-4l-4-4"/><path d="M22 12h-8m0 0l4 4m-4-4l4-4"/><path d="M12 22v-8m0 0l4 4m-4-4l-4 4"/></svg>
          </div>
          <span className="text-white font-semibold text-lg">Real Life Stack</span>
          <span className="text-white/30 mx-2">|</span>
          <span className="text-white/60 text-sm">Dashboard Click-Dummy</span>
        </div>
      </div>
      {/* Dashboard */}
      <DashboardView />
    </div>
  </React.StrictMode>
)

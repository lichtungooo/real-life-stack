import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import 'leaflet/dist/leaflet.css';

// Base path from Vite (e.g. "/edge/" on GitHub Pages)
const base = import.meta.env.BASE_URL || '/';

// GitHub Pages SPA redirect: restore route from ?p= query param
const params = new URLSearchParams(window.location.search);
const redirectPath = params.get('p');
if (redirectPath) {
  // Clean up URL and let React Router handle it
  window.history.replaceState(null, '', base + redirectPath.replace(/^\//, '') + window.location.hash);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={base.replace(/\/$/, '')}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

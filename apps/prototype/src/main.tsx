/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from '@/App';
import '@/index.css';
import 'leaflet/dist/leaflet.css';

// Base path from Vite build (e.g. "/edge/" when built with --base="/edge/")
const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');

// GitHub Pages SPA redirect: restore route from ?p= query param
const searchParams = new URLSearchParams(window.location.search);
const redirectPath = searchParams.get('p');
if (redirectPath) {
  window.history.replaceState(null, '', base + '/' + redirectPath.replace(/^\//, '') + window.location.hash);
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter basename={base}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

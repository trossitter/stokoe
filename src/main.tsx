import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

if (new URLSearchParams(location.search).has("reset")) {
  localStorage.clear();
  // Remove the param so it doesn't persist in history or confuse the app
  const url = new URL(location.href);
  url.searchParams.delete("reset");
  history.replaceState(null, "", url.pathname + (url.search || ""));
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

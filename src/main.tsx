import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Make sure React is defined before rendering
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {

}

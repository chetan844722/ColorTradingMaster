import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// Add custom styles for scrollbar
const style = document.createElement('style');
style.textContent = `
  ::-webkit-scrollbar {
    width: 6px;
  }
  ::-webkit-scrollbar-track {
    background: #1a1a2e;
  }
  ::-webkit-scrollbar-thumb {
    background: #5D3FD3;
    border-radius: 3px;
  }
  
  body {
    background-color: #212136;
    color: #F8F9FA;
    font-family: 'Inter', sans-serif;
  }
  
  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }
  
  .pulse-animation {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
`;
document.head.appendChild(style);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

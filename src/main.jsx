import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Ngăn chặn triệt để lỗi "Failed to execute 'removeChild' on 'Node'" do Google Translate hoặc extension trình duyệt can thiệp DOM
if (typeof window !== 'undefined' && typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function (child) {
    if (child && child.parentNode !== this) {
      if (console && console.warn) {
        console.warn('Blocked removeChild on non-child node (prevented crash):', this, child);
      }
      return child;
    }
    return originalRemoveChild.apply(this, arguments);
  };

  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function (newNode, referenceNode) {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console && console.warn) {
        console.warn('Blocked insertBefore with non-child reference node (prevented crash):', this, referenceNode);
      }
      return newNode;
    }
    return originalInsertBefore.apply(this, arguments);
  };
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

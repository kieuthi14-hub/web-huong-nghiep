import React, { useEffect } from 'react'
import { X, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react'

const Toast = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 4000)

    return () => clearTimeout(timer)
  }, [onClose])

  const styles = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-sky-50 border-sky-200 text-sky-800'
  }

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <AlertCircle className="w-5 h-5 text-red-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <AlertCircle className="w-5 h-5 text-sky-500" />
  }

  return (
    <div className={`fixed bottom-4 right-4 z-50 flex items-center p-4 border rounded-sm shadow-sm max-w-sm animate-reveal ${styles[type]}`}>
      <div className="flex-shrink-0 mr-3">
        {icons[type]}
      </div>
      <div className="mr-8 text-sm font-medium">
        {message}
      </div>
      <button 
        onClick={onClose} 
        className="ml-auto -mx-1.5 -my-1.5 rounded-sm p-1 inline-flex items-center justify-center hover:bg-black/5 text-current focus:outline-none"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default Toast

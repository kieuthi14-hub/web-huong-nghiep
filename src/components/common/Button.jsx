import React from 'react'

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  disabled = false, 
  className = '',
  isLoading = false 
}) => {
  const baseStyle = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-1 border'
  
  const variants = {
    primary: 'bg-brand-500 hover:bg-brand-600 text-white border-brand-500 focus:ring-brand-400 active:scale-[0.98] disabled:bg-brand-300 disabled:border-brand-300',
    secondary: 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 focus:ring-slate-300 active:scale-[0.98] disabled:bg-slate-100 disabled:text-slate-400',
    accent: 'bg-accent-500 hover:bg-accent-600 text-white border-accent-500 focus:ring-accent-400 active:scale-[0.98] disabled:bg-accent-300 disabled:border-accent-300',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-red-600 focus:ring-red-400 active:scale-[0.98] disabled:bg-red-300 disabled:border-red-300',
    outline: 'bg-transparent hover:bg-brand-50 text-brand-600 border-brand-500 focus:ring-brand-400 active:scale-[0.98] disabled:opacity-50'
  }

  const sizes = 'px-4 py-2 text-sm rounded-sm'

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${sizes} ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Đang tải...
        </>
      ) : children}
    </button>
  )
}

export default Button

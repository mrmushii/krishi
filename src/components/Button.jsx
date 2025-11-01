export default function Button({ children, onClick, variant = 'primary', disabled = false, className = '' }) {
  const baseStyles = 'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
  const variants = {
    primary: 'bg-green-600 text-white hover:bg-green-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    outline: 'border-2 border-green-600 text-green-600 hover:bg-green-50'
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  )
}


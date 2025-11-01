const BASE_STYLES =
  'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const VARIANTS = {
  primary: 'bg-farmlink-orange text-white hover:bg-farmlink-orange-hover',
  secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border-2 border-farmlink-orange text-farmlink-orange hover:bg-orange-50'
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  className = '',
  type = 'button',
  ...props
}) {
  const variantClasses = VARIANTS[variant] ?? VARIANTS.primary

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${BASE_STYLES} ${variantClasses} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  )
}

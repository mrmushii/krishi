const BASE_STYLES =
  'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

const VARIANTS = {
  primary: 'bg-deshbazar-primary text-white hover:bg-deshbazar-primary-dark',
  secondary: 'bg-deshbazar-secondary text-deshbazar-text hover:bg-yellow-100',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  outline: 'border-2 border-deshbazar-primary text-deshbazar-primary hover:bg-green-50'
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

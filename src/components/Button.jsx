const BASE_STYLES =
  'px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1'

const VARIANTS = {
  primary: 'bg-emerald-500 text-white hover:bg-emerald-600',
  secondary: 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50',
  outline: 'border-2 border-emerald-500 text-emerald-600 hover:bg-emerald-50',
  muted: 'bg-slate-100 text-slate-700 hover:bg-slate-200',
  danger: 'bg-red-500 text-white hover:bg-red-600',
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

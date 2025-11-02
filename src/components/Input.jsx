import { forwardRef, memo } from 'react'

const Input = memo(
  forwardRef(function Input(
    {
      label,
      type = 'text',
      value,
      onChange,
      placeholder,
      required = false,
      error,
      className = '',
      ...rest
    },
    ref
  ) {
    // dynamic border based on error
    const borderClass = error ? 'border-red-500 focus:ring-red-500' : 'border-emerald-200 focus:ring-emerald-400'
    const combinedClass = `
      w-full px-3 py-2 border rounded-lg 
      bg-white text-slate-900 placeholder-slate-400
      focus:outline-none focus:ring-2 
      transition-colors duration-200
      ${borderClass} ${className}
    `

    return (
      <div className="mb-4">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
            {required && <span className="text-red-500">*</span>}
          </label>
        )}
        <input
          ref={ref}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className={combinedClass.trim()}
          {...rest}
        />
        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
      </div>
    )
  })
)

export default Input

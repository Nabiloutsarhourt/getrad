'use client';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-[#004ac6] text-white hover:bg-blue-800 focus-visible:outline-[#004ac6] shadow-sm',
    secondary: 'bg-[#006c49] text-white hover:bg-green-800 focus-visible:outline-[#006c49] shadow-sm',
    outline: 'border-2 border-[#004ac6] text-[#004ac6] hover:bg-blue-50 focus-visible:outline-[#004ac6]',
    ghost: 'text-[#004ac6] hover:bg-blue-50 focus-visible:outline-[#004ac6]',
    danger: 'bg-[#ba1a1a] text-white hover:bg-red-800 focus-visible:outline-[#ba1a1a] shadow-sm',
    'danger-outline': 'border-2 border-[#ba1a1a] text-[#ba1a1a] hover:bg-red-50 focus-visible:outline-[#ba1a1a]',
    surface: 'bg-white text-[#191c1d] border border-[#c3c6d7] hover:bg-gray-50 shadow-sm',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
    xl: 'px-8 py-4 text-lg gap-2',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${base} ${variants[variant] || variants.primary} ${sizes[size] || sizes.md} ${className}`}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

'use client';

export default function Input({
  label,
  error,
  hint,
  className = '',
  inputClassName = '',
  id,
  type = 'text',
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-[#191c1d]">
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`
          w-full px-4 py-2.5 rounded-xl border text-sm text-[#191c1d] bg-white
          placeholder:text-[#737686]
          transition-all duration-150
          focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:border-[#004ac6]
          disabled:bg-gray-50 disabled:cursor-not-allowed
          ${error ? 'border-[#ba1a1a] focus:ring-[#ba1a1a] focus:border-[#ba1a1a]' : 'border-[#c3c6d7]'}
          ${inputClassName}
        `}
        {...props}
      />
      {error && (
        <span className="text-xs text-[#ba1a1a] flex items-center gap-1">
          <svg className="w-3.5 h-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </span>
      )}
      {hint && !error && (
        <span className="text-xs text-[#737686]">{hint}</span>
      )}
    </div>
  );
}

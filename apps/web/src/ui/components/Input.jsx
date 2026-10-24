export function Input({
  label,
  id,
  type = "text",
  value,
  onChange,
  placeholder,
  prefix,
  suffix,
  helperText,
  error,
  disabled = false,
  required = false,
  mono = false,
  className = "",
  ...props
}) {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={id}
          className="text-xs font-medium text-[#555]"
        >
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      <div
        className={`flex items-center rounded-lg border bg-white transition-colors focus-within:ring-2 focus-within:ring-[#1a1a1a]/10 focus-within:border-[#1a1a1a] ${
          error
            ? "border-red-400 focus-within:ring-red-100 focus-within:border-red-500"
            : "border-[#e8e5e0] hover:border-[#d5d2cd]"
        } ${disabled ? "opacity-60 cursor-not-allowed bg-[#f5f2ef]" : ""}`}
      >
        {prefix && (
          <span className="pl-3 pr-1 text-sm text-[#888] select-none font-mono">
            {prefix}
          </span>
        )}

        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          className={`w-full bg-transparent px-3 py-2.5 text-sm text-[#1a1a1a] placeholder-[#aaa] focus:outline-none ${
            mono ? "font-mono" : ""
          } ${className}`}
          {...props}
        />

        {suffix && (
          <span className="pr-3 pl-1 text-xs text-[#888] select-none">
            {suffix}
          </span>
        )}
      </div>

      {error ? (
        <p className="text-xs text-red-500 mt-0.5">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#aaa] mt-0.5">{helperText}</p>
      ) : null}
    </div>
  );
}

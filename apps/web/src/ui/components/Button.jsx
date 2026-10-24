export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  disabled = false,
  type = "button",
  ...props
}) {
  const baseStyle =
    "inline-flex items-center justify-center font-medium transition-colors duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed select-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs rounded-lg gap-1.5",
    md: "px-4 py-2 text-sm rounded-lg gap-2",
    lg: "px-5 py-2.5 text-sm rounded-lg gap-2",
  };

  const variants = {
    primary:
      "bg-[#1a1a1a] hover:bg-[#333] text-white",
    secondary:
      "bg-white hover:bg-[#f5f2ef] text-[#1a1a1a] border border-[#e8e5e0]",
    outline:
      "bg-transparent hover:bg-[#f0ede8] text-[#555] border border-[#e8e5e0]",
    ghost:
      "bg-transparent hover:bg-[#f0ede8] text-[#555] hover:text-[#1a1a1a]",
    danger:
      "bg-red-600 hover:bg-red-700 text-white",
    terminal:
      "bg-[#f0ede8] text-[#1a1a1a] font-mono border border-[#e8e5e0] hover:bg-[#e8e5e0]",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={`${baseStyle} ${sizeStyles[size] || sizeStyles.md} ${variants[variant] || variants.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

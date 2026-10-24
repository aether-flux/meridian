const AVATAR_COLORS = [
  "bg-[#1a1a1a]",
  "bg-[#555555]",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-[#888888]",
  "bg-teal-600",
  "bg-orange-600",
  "bg-[#333333]",
];

function getColorFromName(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function Avatar({
  src,
  name = "User",
  initials,
  size = "md",
  className = "",
}) {
  const displayInitials =
    initials ||
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const sizeClasses = {
    xs: "w-5 h-5 text-[9px]",
    sm: "w-7 h-7 text-[10px]",
    md: "w-8 h-8 text-xs font-semibold",
    lg: "w-10 h-10 text-sm font-semibold",
    xl: "w-14 h-14 text-base font-bold",
  };

  const bgColor = getColorFromName(name);

  return (
    <div className={`relative inline-flex flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover bg-[#f0ede8]`}
        />
      ) : (
        <div
          className={`${sizeClasses[size] || sizeClasses.md} ${bgColor} rounded-full text-white flex items-center justify-center select-none`}
        >
          {displayInitials}
        </div>
      )}
    </div>
  );
}

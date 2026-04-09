interface AvatarProps {
  src?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "h-7 w-7 text-[11px]",
  md: "h-8 w-8 text-xs",
  lg: "h-11 w-11 text-sm",
  xl: "h-16 w-16 text-xl",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Avatar({ src, name, size = "md", className = "" }: AvatarProps) {
  const sizeClass = sizeMap[size];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizeClass} rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700 ${sizeClass} ${className}`}
    >
      {getInitials(name || "??")}
    </div>
  );
}

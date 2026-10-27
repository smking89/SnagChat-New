type AvatarTone = "glass" | "soft" | "ink" | "brand";

const TONES: Record<AvatarTone, string> = {
  glass: "bg-white/20 text-white ring-1 ring-inset ring-white/35 backdrop-blur-sm",
  soft: "bg-brand-soft text-brand",
  ink: "bg-ink text-white",
  brand: "bg-brand text-white",
};

type AvatarProps = {
  name: string;
  size?: number;
  tone?: AvatarTone;
  className?: string;
  src?: string;
  /** Shows a green presence dot on the avatar. */
  online?: boolean;
};

export function Avatar({ name, size = 22, tone = "soft", className = "", src, online = false }: AvatarProps) {
  const letter = name.trim().charAt(0).toUpperCase() || "?";

  const face = src ? (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      draggable={false}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full object-cover ${tone === "glass" ? "ring-1 ring-white/40" : ""} ${className}`}
    />
  ) : (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.46) }}
      className={`grid shrink-0 place-items-center rounded-full font-bold leading-none ${TONES[tone]} ${className}`}
    >
      {letter}
    </span>
  );

  if (!online) return face;

  const dot = Math.max(8, Math.round(size * 0.3));

  return (
    <span className="relative inline-flex shrink-0" style={{ width: size, height: size }}>
      {face}
      <span
        aria-hidden="true"
        title="Online"
        style={{ width: dot, height: dot }}
        className="absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-white bg-[#22c55e]"
      />
    </span>
  );
}

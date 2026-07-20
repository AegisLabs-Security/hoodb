interface ChipProps {
  icon?: React.ReactNode;
  label: string;
  tone: "neon" | "orange" | "red" | "blue";
}

export function Chip({ icon, label, tone }: ChipProps) {
  const tones = {
    neon: "bg-neon/10 text-neon border-neon/30",
    orange: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    red: "bg-red-500/15 text-red-300 border-red-500/30",
    blue: "bg-blue-400/15 text-blue-300 border-blue-400/30",
  } as const;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold uppercase tracking-widest border ${tones[tone]}`}>
      {icon}
      {label}
    </span>
  );
}
